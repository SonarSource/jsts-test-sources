import { MenuIDs } from '../main-process/menu'
import { merge } from './merge'
import { IAppState, SelectionType } from '../lib/app-state'
import { Repository } from '../models/repository'
import { CloningRepository } from './dispatcher'
import { TipState } from '../models/tip'
import { updateMenuState as ipcUpdateMenuState } from '../ui/main-process-proxy'
import { AppMenu, MenuItem } from '../models/app-menu'

export interface IMenuItemState {
  readonly enabled?: boolean
}

/**
 * Utility class for coalescing updates to menu items
 */
class MenuStateBuilder {

  private readonly _state = new Map<MenuIDs, IMenuItemState>()

  /**
   * Returns an Map where each key is a MenuID and the values
   * are IMenuItemState instances containing information about
   * whether a particular menu item should be enabled/disabled or
   * visible/hidden.
   */
  public get state() {
    return new Map<MenuIDs, IMenuItemState>(this._state)
  }

  private updateMenuItem<K extends keyof IMenuItemState>(id: MenuIDs, state: Pick<IMenuItemState, K>) {
    const currentState = this._state.get(id) || { }
    this._state.set(id, merge(currentState, state))
  }

  /** Set the state of the given menu item id to enabled */
  public enable(id: MenuIDs): this {
    this.updateMenuItem(id, { enabled: true })
    return this
  }

  /** Set the state of the given menu item id to disabled */
  public disable(id: MenuIDs): this {
    this.updateMenuItem(id, { enabled: false })
    return this
  }

  /** Set the enabledness of the given menu item id */
  public setEnabled(id: MenuIDs, enabled: boolean): this {
    this.updateMenuItem(id, { enabled })
    return this
  }
}

function isRepositoryHostedOnGitHub(repository: Repository | CloningRepository) {
  if (!repository || repository instanceof CloningRepository || !repository.gitHubRepository) {
    return false
  }

  return repository.gitHubRepository.htmlURL !== null
}

function menuItemStateEqual(state: IMenuItemState, menuItem: MenuItem) {
  if (state.enabled !== undefined && menuItem.type !== 'separator' && menuItem.enabled !== state.enabled) {
    return false
  }

  return true
}

function getMenuState(state: IAppState): Map<MenuIDs, IMenuItemState> {
  const selectedState = state.selectedState
  const isHostedOnGitHub = selectedState
    ? isRepositoryHostedOnGitHub(selectedState.repository)
    : false

  let repositorySelected = false
  let onNonDefaultBranch = false
  let onBranch = false
  let hasDefaultBranch = false
  let hasPublishedBranch = false
  let networkActionInProgress = false
  let tipStateIsUnknown = false

  if (selectedState && selectedState.type === SelectionType.Repository) {
    repositorySelected = true

    const branchesState = selectedState.state.branchesState
    const tip = branchesState.tip
    const defaultBranch = branchesState.defaultBranch

    hasDefaultBranch = Boolean(defaultBranch)

    onBranch = tip.kind === TipState.Valid
    tipStateIsUnknown = tip.kind === TipState.Unknown

    // If we are:
    //  1. on the default branch, or
    //  2. on an unborn branch, or
    //  3. on a detached HEAD
    // there's not much we can do.
    if (tip.kind === TipState.Valid) {
      if (defaultBranch !== null) {
        onNonDefaultBranch = tip.branch.name !== defaultBranch.name
      }

      hasPublishedBranch = !!tip.branch.upstream
    } else {
      onNonDefaultBranch = true
    }

    networkActionInProgress = selectedState.state.isPushPullFetchInProgress
  }

  // These are IDs for menu items that are entirely _and only_
  // repository-scoped. They're always enabled if we're in a repository and
  // always disabled if we're not.
  const repositoryScopedIDs: ReadonlyArray<MenuIDs> = [
    'branch',
    'repository',
    'remove-repository',
    'open-in-shell',
    'open-working-directory',
    'show-repository-settings',
    'create-branch',
    'show-changes',
    'show-history',
    'show-repository-list',
    'show-branches-list',
  ]

  const menuStateBuilder = new MenuStateBuilder()

  const windowOpen = state.windowState !== 'hidden'
  const repositoryActive = windowOpen && repositorySelected
  if (repositoryActive) {
    for (const id of repositoryScopedIDs) {
      menuStateBuilder.enable(id)
    }

    menuStateBuilder.setEnabled('rename-branch', onNonDefaultBranch)
    menuStateBuilder.setEnabled('delete-branch', onNonDefaultBranch)
    menuStateBuilder.setEnabled('update-branch', onNonDefaultBranch && hasDefaultBranch)
    menuStateBuilder.setEnabled('merge-branch', onBranch)
    menuStateBuilder.setEnabled('compare-branch', isHostedOnGitHub && hasPublishedBranch)

    menuStateBuilder.setEnabled('view-repository-on-github', isHostedOnGitHub)
    menuStateBuilder.setEnabled('push', !networkActionInProgress)
    menuStateBuilder.setEnabled('pull', !networkActionInProgress)
    menuStateBuilder.setEnabled('create-branch', !tipStateIsUnknown)
  } else {
    for (const id of repositoryScopedIDs) {
      menuStateBuilder.disable(id)
    }

    menuStateBuilder.disable('rename-branch')
    menuStateBuilder.disable('delete-branch')
    menuStateBuilder.disable('update-branch')
    menuStateBuilder.disable('merge-branch')
    menuStateBuilder.disable('compare-branch')

    menuStateBuilder.disable('view-repository-on-github')
    menuStateBuilder.disable('push')
    menuStateBuilder.disable('pull')
  }

  return menuStateBuilder.state
}

/**
 * Update the menu state in the main process.
 * 
 * This function will set the enabledness and visibility of menu items
 * in the main process based on the AppState. All changes will be
 * batched together into one ipc message.
 */
export function updateMenuState(state: IAppState, currentAppMenu: AppMenu | null) {
  const menuState = getMenuState(state)

  // Try to avoid updating sending the IPC message at all
  // if we have a current app menu that we can compare against.
  if (currentAppMenu) {

    for (const [ id, menuItemState ] of menuState.entries()) {

      const appMenuItem = currentAppMenu.getItemById(id)

      if (appMenuItem && menuItemStateEqual(menuItemState, appMenuItem)) {
        menuState.delete(id)
      }
    }
  }

  if (menuState.size === 0) {
    return
  }

  // because we can't send Map over the wire, we need to convert
  // the remaining entries into an array that can be serialized
  const array = new Array<{id: MenuIDs, state: IMenuItemState}>()
  menuState.forEach((value, key) => array.push({ id: key, state: value }))
  ipcUpdateMenuState(array)
}

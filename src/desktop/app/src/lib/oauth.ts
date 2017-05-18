import { shell } from 'electron'
import { Account } from '../models/account'
import { fatalError } from './fatal-error'
import {
  getOAuthAuthorizationURL,
  requestOAuthToken,
  fetchUser,
} from './api'
import { uuid } from './uuid'

interface IOAuthState {
  readonly state: string
  readonly endpoint: string
  readonly resolve: (account: Account) => void
  readonly reject: (error: Error) => void
}

let oauthState: IOAuthState | null = null

/**
 * Ask the user to auth with the given endpoint. This will open their browser.
 *
 * @param endpoint - The endpoint to auth against.
 *
 * Returns a {Promise} which will resolve when the OAuth flow as been completed.
 * Note that the promise may not complete if the user doesn't complete the OAuth
 * flow.
 */
export function askUserToOAuth(endpoint: string) {
  // Disable the lint warning since we're storing the `resolve` and `reject`
  // functions.
  // tslint:disable-next-line:promise-must-complete
  return new Promise<Account>((resolve, reject) => {
    oauthState = { state: uuid(), endpoint, resolve, reject }

    const oauthURL = getOAuthAuthorizationURL(endpoint, oauthState.state)
    shell.openExternal(oauthURL)
  })
}

/**
 * Request the authenticated using, using the code given to us by the OAuth
 * callback.
 */
export async function requestAuthenticatedUser(code: string): Promise<Account | null> {
  if (!oauthState) {
    return fatalError('`askUserToOAuth` must be called before requesting an authenticated user.')
  }

  const token = await requestOAuthToken(oauthState.endpoint, oauthState.state, code)
  if (token) {
    return fetchUser(oauthState.endpoint, token)
  } else {
    return null
  }
}

/**
 * Resolve the current OAuth request with the given account.
 *
 * Note that this can only be called after `askUserToOAuth` has been called and
 * must only be called once.
 */
export function resolveOAuthRequest(account: Account) {
  if (!oauthState) {
    return fatalError('`askUserToOAuth` must be called before resolving an auth request.')
  }

  oauthState.resolve(account)

  oauthState = null
}

/**
 * Reject the current OAuth request with the given error.
 *
 * Note that this can only be called after `askUserToOAuth` has been called and
 * must only be called once.
 */
export function rejectOAuthRequest(error: Error) {
  if (!oauthState) {
    return fatalError('`askUserToOAuth` must be called before rejecting an auth request.')
  }

  oauthState.reject(error)

  oauthState = null
}

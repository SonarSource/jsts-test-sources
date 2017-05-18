interface IGitRemoteURL {
  /** The hostname of the remote. */
  readonly hostname: string

  /**
   * The owner of the GitHub repository. This will be null if the URL doesn't
   * take the form of a GitHub repository URL (e.g., owner/name).
   */
  readonly owner: string | null

  /**
   * The name of the GitHub repository. This will be null if the URL doesn't
   * take the form of a GitHub repository URL (e.g., owner/name).
   */
  readonly name: string | null
}

/** Parse the remote information from URL. */
export function parseRemote(url: string): IGitRemoteURL | null {
  // Examples:
  // https://github.com/octocat/Hello-World.git
  // git@github.com:octocat/Hello-World.git
  // git:github.com/octocat/Hello-World.git
  const regexes = [
    new RegExp('^https?://(.+)/(.+)/(.+?)(?:\.git)?$'),
    new RegExp('^git@(.+):(.+)/(.+)(?:\.git)$'),
    new RegExp('^git:(.+)/(.+)/(.+)(?:\.git)$'),
  ]

  for (const regex of regexes) {
    const result = url.match(regex)
    if (!result) { continue }

    const hostname = result[1]
    const owner = result[2]
    const name = result[3]
    if (hostname) {
      return { hostname, owner, name }
    }
  }

  return null
}

export interface IRepositoryIdentifier {
  readonly owner: string
  readonly name: string
}

/** Try to parse an owner and name from a URL or owner/name shortcut. */
export function parseOwnerAndName(url: string): IRepositoryIdentifier | null {
  const parsed = parseRemote(url)
  // If we can parse it as a remote URL, we'll assume they gave us a proper
  // URL. If not, we'll try treating it as a GitHub repository owner/name
  // shortcut.
  if (parsed) {
    const owner = parsed.owner
    const name = parsed.name
    if (owner && name) {
      return { owner, name }
    }
  }

  const pieces = url.split('/')
  if (pieces.length === 2 && pieces[0].length > 0 && pieces[1].length > 0) {
    const owner = pieces[0]
    const name = pieces[1]
    return { owner, name }
  }

  return null
}

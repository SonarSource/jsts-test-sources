import { git } from './core'
import { FileStatus, FileChange } from '../../models/status'
import { Repository } from '../../models/repository'
import { Commit } from '../../models/commit'
import { CommitIdentity } from '../../models/commit-identity'
import { mapStatus } from './status'

/**
 * Get the repository's commits using `revisionRange` and limited to `limit`
 */
export async function getCommits(repository: Repository, revisionRange: string, limit: number, additionalArgs: ReadonlyArray<string> = []): Promise<ReadonlyArray<Commit>> {
  const delimiter = '1F'
  const delimiterString = String.fromCharCode(parseInt(delimiter, 16))
  const prettyFormat = [
    '%H', // SHA
    '%s', // summary
    '%b', // body
    // author identity string, matching format of GIT_AUTHOR_IDENT.
    //   author name <author email> <author date>
    // author date format dependent on --date arg, should be raw
    '%an <%ae> %ad',
    '%P', // parent SHAs
  ].join(`%x${delimiter}`)

  const result = await git([
    'log',
    revisionRange,
    `--date=raw`,
    `--max-count=${limit}`,
    `--pretty=${prettyFormat}`,
    '-z',
    '--no-color', ...additionalArgs,
  ], repository.path, 'getCommits', { successExitCodes: new Set([ 0, 128 ]) })

  // if the repository has an unborn HEAD, return an empty history of commits
  if (result.exitCode === 128) {
    return new Array<Commit>()
  }

  const out = result.stdout
  const lines = out.split('\0')
  // Remove the trailing empty line
  lines.splice(-1, 1)

  const commits = lines.map(line => {
    const pieces = line.split(delimiterString)
    const sha = pieces[0]
    const summary = pieces[1]
    const body = pieces[2]
    const authorIdentity = pieces[3]
    const shaList = pieces[4]
    const parentSHAs = shaList.length
     ? shaList.split(' ')
     : [ ]

    const author = CommitIdentity.parseIdentity(authorIdentity)

    if (!author) {
      throw new Error(`Couldn't parse author identity ${authorIdentity}`)
    }

    return new Commit(sha, summary, body, author, parentSHAs)
  })

  return commits
}

/** Get the files that were changed in the given commit. */
export async function getChangedFiles(repository: Repository, sha: string): Promise<ReadonlyArray<FileChange>> {
  // opt-in for rename detection (-M) and copies detection (-C)
  // this is equivalent to the user configuring 'diff.renames' to 'copies'
  // NOTE: order here matters - doing -M before -C means copies aren't detected
  const args = [ 'log', sha, '-C', '-M', '-m', '-1', '--first-parent', '--name-status', '--format=format:', '-z' ]
  const result = await git(args, repository.path, 'getChangedFiles')

  const out = result.stdout
  const lines = out.split('\0')
  // Remove the trailing empty line
  lines.splice(-1, 1)

  const files: FileChange[] = []
  for (let i = 0; i < lines.length; i++) {
    const statusText = lines[i]

    const status = mapStatus(statusText)

    let oldPath: string | undefined = undefined

    if (status === FileStatus.Renamed || status === FileStatus.Copied) {
      oldPath = lines[++i]
    }

    const path = lines[++i]

    files.push(new FileChange(path, status, oldPath))
  }

  return files
}

/** Get the commit for the given ref. */
export async function getCommit(repository: Repository, ref: string): Promise<Commit | null> {
  const commits = await getCommits(repository, ref, 1)
  if (commits.length < 1) { return null }

  return commits[0]
}

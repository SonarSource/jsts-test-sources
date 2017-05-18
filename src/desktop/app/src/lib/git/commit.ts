import { git, GitError } from './core'
import { stageFiles } from './add'
import { Repository } from '../../models/repository'
import { WorkingDirectoryFileChange } from '../../models/status'
import { unstageAll } from './reset'

export async function createCommit(repository: Repository, message: string, files: ReadonlyArray<WorkingDirectoryFileChange>): Promise<boolean> {
  // Clear the staging area, our diffs reflect the difference between the
  // working directory and the last commit (if any) so our commits should
  // do the same thing.
  await unstageAll(repository)

  await stageFiles(repository, files)

  try {
    await git([ 'commit', '-F',  '-' ] , repository.path, 'createCommit', { stdin: message })
    return true
  } catch (e) {
    // Commit failures could come from a pre-commit hook rejection. So display
    // a bit more context than we otherwise would.
    if (e instanceof GitError) {
      const output = e.result.stderr.trim()

      let standardError = ''
      if (output.length > 0) {
        standardError = `, with output: '${output}'`
      }
      const exitCode = e.result.exitCode
      const error = new Error(`Commit failed - exit code ${exitCode} received${standardError}`)
      error.name = 'commit-failed'
      throw error
    } else {
      throw e
    }
  }
}

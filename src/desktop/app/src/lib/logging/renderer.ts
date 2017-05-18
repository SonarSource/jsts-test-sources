import { formatError } from './format-error'
import { log } from '../../ui/main-process-proxy'

/**
 * Dispatches the given log message to the main process where it will be picked
 * up and written to all log transports at the 'info' log level. See
 * initializeWinston in logger.ts for more details about what transports we
 * set up.
 */
export function logInfo(message: string) {
  log({ level: 'info', message })
  if (__DEV__) {
    console.info(message)
  }
}

/**
 * Dispatches the given log message to the main process where it will be picked
 * up and written to all log transports at the 'debug' log level. See
 * initializeWinston in logger.ts for more details about what transports we
 * set up.
 */
export function logDebug(message: string) {
  log({ level: 'debug', message })
  if (__DEV__) {
    console.debug(message)
  }
}

/**
 * Dispatches the given log message to the main process where it will be picked
 * up and written to all log transports at the 'error' log level. See
 * initializeWinston in logger.ts for more details about what transports we
 * set up.
 */
export function logError(message: string, error?: Error) {
  if (error) {
    log({ level: 'error', message: formatError(error, message) })
  } else {
    log({ level: 'error', message })
  }

  console.error(message, error)
}

import logger from './logger'

type ErrorType =
  | 'PackageManagerError'
  | 'AdapterNotFoundError'
  | 'AdapterGetAPIError'
  | 'AdapterLoadError'
  | 'AdapterStopError'
  | 'AdapterStartError'
  | 'UnknownError'

export class RubickError extends Error {
  constructor(type: ErrorType, msg: string, err?: Error) {
    super(msg)
    this.name = type

    if (err !== undefined) {
      this.message = err.message + '\n' + this.message
      this.stack = err.stack
    }

    logger.error(this)
  }
}

import logger from './logger'

type ErrorType =
  | 'PackageManagerError'
  | 'PluginNotFoundError'
  | 'PluginGetAPIError'
  | 'PluginStopError'
  | 'PluginStartError'
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

export interface PluginHandlerImp {
  baseDir: string
  registry: string
}

export interface RubickPlugin<Options, API> {
  start: (opt: Options) => Promise<void>
  stop: () => Promise<void>
  api: () => Promise<API>
}

export interface PluginRegedit<API> extends Map<string, API> {}

export type Plugins = string[]

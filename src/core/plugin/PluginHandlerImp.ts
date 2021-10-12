export interface PluginHandlerImp {
  baseDir: string
  registry: string
}

export interface PluginDependencies {
  [name: string]: string
}

export type Plugins = string[]

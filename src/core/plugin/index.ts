import {
  PluginDependencies,
  PluginHandlerImp,
  Plugins
} from './PluginHandlerImp'
import execa from 'execa'
import fs from 'fs-extra'

class PluginHandler implements PluginHandlerImp {
  public baseDir: string
  public registry: string

  constructor(options: { baseDir: string; registry: string }) {
    this.baseDir = options.baseDir
    this.registry = options.registry || 'https://registry.npm.taobao.org'
  }

  async install(plugins: Plugins): Promise<void> {
    if (!(await fs.pathExists(this.baseDir))) {
      const pkgFilePath = `${this.baseDir}/package.json`
      fs.mkdirSync(this.baseDir)
      fs.writeFileSync(pkgFilePath, '{}')
    }
    await this.execCommand('install', plugins)
  }

  async update(plugins: Plugins): Promise<void> {
    await this.execCommand('install', plugins)
  }

  async uninstall(plugins: Plugins): Promise<void> {
    await this.execCommand('uninstall', plugins)
  }

  get pluginList(): Promise<PluginDependencies> {
    const installInfo: string = fs.readFileSync(
      `${this.baseDir}/package.json`,
      'utf-8'
    )
    return JSON.parse(installInfo).dependencies
  }

  async execCommand(cmd: string, modules: string[]): Promise<string> {
    let args: string[] = [cmd]
      .concat(modules)
      .concat('--color=always')
      .concat('--save')
    args = args.concat(`--registry=${this.registry}`)

    const { stdout } = await execa('npm', args, { cwd: this.baseDir })
    return stdout
  }
}

export default PluginHandler

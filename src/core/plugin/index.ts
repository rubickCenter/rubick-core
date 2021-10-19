import { PluginHandlerImp, Plugins } from './PluginHandlerImp'
import execa from 'execa'
import fs from 'fs-extra'
import path from 'path'
import search, { Result } from 'libnpmsearch'
import { IPackageJson, IDependency } from '@ts-type/package-dts/package-json'

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
      fs.writeFileSync(pkgFilePath, '{"dependencies":{}}')
    }
    await this.execCommand('add', plugins)
  }

  // 搜索 npm 包, 传入 streamFunc 可以流式处理
  async search(plugin: string, streamFunc?: (data: Result) => void) {
    return new Promise<Result[]>((resolve, reject) => {
      const result: Result[] = []
      const stream = search.stream(plugin)
      stream.on('data', (data: Result) => {
        result.push(data)
        if (streamFunc !== undefined) streamFunc(data)
      })
      stream.on('end', () => {
        resolve(result)
      })
      stream.on('error', e => {
        reject(e)
      })
    })
  }

  async update(plugins: Plugins): Promise<void> {
    await this.execCommand('update', plugins)
  }

  async uninstall(plugins: Plugins): Promise<void> {
    await this.execCommand('remove', plugins)
  }

  get pluginList() {
    const installInfo: IPackageJson = JSON.parse(
      fs.readFileSync(`${this.baseDir}/package.json`, 'utf-8')
    )
    return installInfo.dependencies as IDependency
  }

  async execCommand(cmd: string, modules: string[]): Promise<string> {
    let args: string[] = [cmd].concat(modules).concat('--color=always')
    args = args.concat(`--registry=${this.registry}`)
    const { stdout } = await execa(
      path.resolve('node_modules/.bin/pnpm'),
      args,
      {
        cwd: this.baseDir
      }
    )
    return stdout
  }
}

export default PluginHandler

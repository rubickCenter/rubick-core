import { PluginHandlerImp, Plugins } from './PluginHandlerImp'
import execa from 'execa'
import fs from 'fs-extra'
import search, { Result } from 'libnpmsearch'
import { IPackageJson, IDependency } from '@ts-type/package-dts/package-json'
import path from 'path'

class PluginHandler implements PluginHandlerImp {
  public baseDir: string
  public registry: string

  // todo 维护插件Map 在启动时进行全局自动启动、关闭
  constructor(options: { baseDir: string; registry: string }) {
    this.baseDir = options.baseDir
    this.registry = options.registry || 'https://registry.npm.taobao.org'
  }

  async start() {}
  async close() {}
  // 从注册表的插件对象中 getAPI
  async api(plugin: string) {
    return await import(path.resolve(this.baseDir, 'node_modules', plugin))
  }

  // todo 安装后注册进插件注册表并启动
  async install(plugins: Plugins) {
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

  // 更新插件
  async update(plugins: Plugins) {
    await this.execCommand('update', plugins)
  }

  // todo 关闭并卸载插件
  async uninstall(plugins: Plugins) {
    await this.execCommand('remove', plugins)
  }

  // 列出所有已安装插件
  async list() {
    const installInfo: IPackageJson = JSON.parse(
      await fs.readFile(`${this.baseDir}/package.json`, 'utf-8')
    )
    return installInfo.dependencies as IDependency
  }

  private async execCommand(cmd: string, modules: string[]): Promise<string> {
    let args: string[] = [cmd].concat(modules).concat('--color=always')
    args = args.concat(`--registry=${this.registry}`)
    const { stdout } = await execa(
      path.resolve(__dirname, '../../node_modules/.bin/pnpm'),
      args,
      {
        cwd: this.baseDir
      }
    )
    return stdout
  }
}

export default PluginHandler

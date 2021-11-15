import darwinSearch from './search/darwin'
import linuxSearch from './search/linux'
import winSearch from './search/win'
import { newRubickBase, RubickBase } from 'rubickbase/dist/index.js'

interface Opt {
  nativeImage?: any
  extraDirs?: string[]
}

export interface AppPlugin {
  name: string
  keyWords: string[]
  [k: string]: string | number | string[]
}

export default class AppSearchAdapter {
  private readonly opt: Opt
  private readonly base: RubickBase
  appList: AppPlugin[] = []

  constructor(opt: Opt) {
    if (opt.nativeImage === undefined) {
      throw new Error('nativeImage cannot be undefined!')
    }
    this.opt = opt
    this.base = newRubickBase()
  }

  start() {
    // do something
  }

  async api() {
    return {
      // 更新搜索应用列表缓存
      updateList: this.updateList
    }
  }

  private async updateList() {
    if (process.platform === 'darwin') {
      this.appList = await darwinSearch(this.opt.nativeImage)
    } else if (process.platform === 'linux') {
      // linux 的结果
      const { getInstalledApps } = await this.base.getBasicAPI()

      this.appList = linuxSearch(
        JSON.parse((await getInstalledApps(true, this.opt.extraDirs)) as string)
      )
    } else if (process.platform === 'win32') {
      // win 的快捷方式列表
      const { getInstalledApps } = await this.base.getBasicAPI()

      const lnkList = JSON.parse(
        (await getInstalledApps(false, this.opt.extraDirs)) as string
      )
      // 解析快捷方式
      for (const lnk of lnkList) {
        this.appList.push(await winSearch(lnk))
      }
    }
  }

  async stop() {
    'ok'
  }
}

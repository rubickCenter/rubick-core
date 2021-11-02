import darwinSearch from './search/darwin'
import linuxSearch from './search/linux'
import winSearch from './search/win'
import { newRubickBase, RubickBase } from 'rubickbase'

type Opt = { nativeImage?: any; extraDirs?: string[] }

export interface AppPlugin {
  name: string
  keyWords: string[]
  [k: string]: string | number | string[]
}

export default class AppSearchAdapter {
  private opt: Opt
  private baseAPI: ReturnType<RubickBase['getBasicAPI']>
  appList: AppPlugin[] = []

  constructor(opt: Opt) {
    if (opt.nativeImage === undefined) {
      throw new Error('nativeImage cannot be undefined!')
    }
    this.opt = opt
    this.baseAPI = newRubickBase().getBasicAPI()
  }

  async start() {
    await this.updateList()
  }

  async api() {
    return {
      // 更新搜索应用列表缓存
      updateList: this.updateList
    }
  }

  private async updateList() {
    const { getInstalledApps } = await this.baseAPI
    if (process.platform === 'darwin') {
      this.appList = await darwinSearch(this.opt.nativeImage)
    } else if (process.platform === 'linux') {
      // linux 下直接返回结果
      this.appList = linuxSearch(
        JSON.parse((await getInstalledApps(true, this.opt.extraDirs)) as string)
      )
    } else if (process.platform === 'win32') {
      // win 下返回快捷方式列表
      const lnkList = JSON.parse(
        (await getInstalledApps(false, this.opt.extraDirs)) as string
      )
      // 解析快捷方式
      for (const lnk of lnkList) {
        this.appList.push(await winSearch(lnk))
      }
    }
  }

  async stop() {}
}

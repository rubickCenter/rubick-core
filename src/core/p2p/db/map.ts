import { Doc, Map as YMap, Transaction, YEvent } from 'yjs'

export default class CRDTMap<T> {
  private readonly dbMap: YMap<T>

  constructor(ydoc: Doc, mapName: string) {
    this.dbMap = ydoc.getMap(mapName)
  }

  // load json (batch update)
  fromJSON(json: object | string) {
    json = typeof json === 'string' ? JSON.parse(json) : json
    const dataMap = new Map(Object.entries(json))
    dataMap.forEach(k => {
      this.dbMap.set(k, dataMap.get(k))
    })
  }

  // export json
  toJSON() {
    return this.dbMap.toJSON()
  }

  has(key: string) {
    return this.dbMap.has(key)
  }

  get(key: string) {
    return this.dbMap.get(key)
  }

  set(key: string, value: T) {
    this.dbMap.set(key, value)
  }

  del(key: string) {
    this.dbMap.delete(key)
  }

  clear() {
    this.dbMap.clear()
  }

  keys() {
    return this.dbMap.keys()
  }

  values() {
    return this.dbMap.values()
  }

  pairs(): IterableIterator<[string, T]> {
    return this.dbMap.entries()
  }

  get size() {
    return this.dbMap.size
  }

  get forEach() {
    return this.dbMap.forEach
  }

  // 监听数据变动当数据从其他设备同步时调用 hook , 返回取消调用的函数
  get observe() {
    return (hook: (event: YEvent, transaction: Transaction) => void) => {
      this.dbMap.observe(hook)
      return () => this.dbMap.unobserve(hook)
    }
  }

  // 递归深度监听数据变动
  get observeDeep() {
    return (hook: (event: YEvent[], transaction: Transaction) => void) => {
      this.dbMap.observeDeep(hook)
      return () => this.dbMap.unobserveDeep(hook)
    }
  }
}

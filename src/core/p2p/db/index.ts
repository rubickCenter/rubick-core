import { Doc as YDoc } from 'yjs'
import CRDTMap from './map'
import CRDTUtoolsArray from './utoolsarray'

/** 数据同步层
 * 数据同步层是一个分布式数据库, 使用基于 yjs 的 CRDT 算法处理数据一致性, 基于 hypercore-protocol 进行P2P通信同步[TODO], 可以看作是一个高效率(https://github.com/dmonad/crdt-benchmarks)的准区块链(节点可信的情况下)
 *
 * 特点:
 * > 可追溯历史数据改动
 * > 可以离线工作
 * > 可无限拓展
 * > 至少有一个节点保存数据, 数据就不会丢失
 *
 * 缺点:
 * > 如果所有数据副本都被销毁, 那么数据就会丢失 ( 可通过固定节点进行备份解决 )
 * > 数据历史的增加会导致每份数据越来越庞大 ( 可通过中心服务器定期的垃圾回收解决 )
 *
 * [todo] 以 collection 为粒度跨设备同步，可选择开关
 */
export class SyncDB {
  name: string
  constructor(name: string) {
    this.name = name
  }

  // collections
  // 兼容 utools API 的 Array
  newUtoolsArray(name: string, doc?: YDoc) {
    doc = doc ?? new YDoc()
    return new CRDTUtoolsArray(doc, name)
  }

  // Map
  newMap(name: string, doc?: YDoc) {
    doc = doc ?? new YDoc()
    return new CRDTMap(doc, name)
  }
}

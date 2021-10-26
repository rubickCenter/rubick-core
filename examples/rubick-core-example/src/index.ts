import path from 'path'
import os from 'os'
import {
  newAdapterHandler,
  AdapterHandlerOptions
} from '../../../packages/rubick-core/src'
import db from '../../../packages/rubick-adapter-db/src'

// 这是预加载的内置插件
// 如果需要动态安装插件请看 packages/rubick-core/tests/plugin.test.ts 中的示例
// 创建 db 插件实例
const adapterDB = new db<string>({
  dbPath: 'tmp'
})

// 系统插件管理器配置
const adapterHandlerConfig: AdapterHandlerOptions = {
  baseDir: path.join(os.tmpdir(), 'test-' + Date.now().toString()),
  registry: 'https://registry.npm.taobao.org',
  loglevel: 5,
  adapterInit: { 'rubick-adapter-db': adapterDB }
}

async function main() {
  // 创建系统插件管理并初始化
  const core = await newAdapterHandler(adapterHandlerConfig)

  // 获取 db 插件的能力API
  const db = await core.api<db<string>>('rubick-adapter-db')

  // 插入一条数据
  await db.put('test', {
    _id: `demo_123`,
    data: 'demo'
  })

  // 读取刚刚的数据
  console.log(JSON.stringify(await db.get('test', 'demo_123')))
  // print ->
  // ℹ Adapter rubick-adapter-db started
  // {"data":"demo","_id":"demo_123","_rev":"1-200e98e7223b5c449488e35d68d9054f"}
}

main()

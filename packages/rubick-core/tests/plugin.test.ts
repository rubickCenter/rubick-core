import { PluginHandler } from '../src'
import path from 'path'
import fs from 'fs-extra'

const pluginDic = path.join(__dirname, 'tmp')

const pluginInstance = new PluginHandler({
  baseDir: pluginDic,
  registry: 'https://registry.npm.taobao.org/'
})

test('Search Plugin', async () => {
  await pluginInstance.search('rubick-plugin-db', r => {
    expect(r.name).toBe('rubick-plugin-db')
  })
}, 10000)

test('Install Plugin', async () => {
  await pluginInstance.install(['rubick-plugin-db'])
  expect(typeof (await pluginInstance.list())['rubick-plugin-db']).toBe(
    'string'
  )
})

test('Get Plugin', async () => {
  console.log(await pluginInstance.api('rubick-plugin-db'))
})

fs.rmSync(pluginDic, { recursive: true, force: true })

import { PluginHandler } from '../src/core'
import path from 'path'
import fs from 'fs-extra'
if (!fs.pathExistsSync(path.join(__dirname, 'tmp'))) {
  fs.mkdirSync(path.join(__dirname, 'tmp'))
}
const pluginDic = path.join(__dirname, 'tmp', 'plugin')

const pluginInstance = new PluginHandler({
  baseDir: pluginDic,
  registry: 'https://registry.npm.taobao.org'
})

test('Search Plugin', async () => {
  await pluginInstance.search('rubick-plugin-demo', r => {
    expect(r.name).toBe('rubick-plugin-demo')
  })
}, 10000)

test('Install Plugin', async () => {
  await pluginInstance.install(['rubick-plugin-demo'])
  expect(typeof pluginInstance.pluginList['rubick-plugin-demo']).toBe('string')
})

fs.rmSync(pluginDic, { recursive: true, force: true })

import { PluginHandler } from '../src/core'
import path from 'path'
import fs from 'fs-extra'

const pluginDic = path.join(__dirname, 'tmp', 'plugin')

const pluginInstance = new PluginHandler({
  baseDir: pluginDic,
  registry: 'https://registry.npm.taobao.org'
})

test('Install Plugin', async () => {
  await pluginInstance.install(['rubick-plugin-demo'])
  expect(typeof (await pluginInstance.pluginList)).toBe('object')
})

fs.rmSync(pluginDic, { recursive: true, force: true })

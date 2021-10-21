import { PluginHandler } from '../src'
import path from 'path'
import os from 'os'

const pluginDic = path.join(os.tmpdir(), 'test')

const pluginInstance = new PluginHandler({
  baseDir: pluginDic,
  registry: 'https://registry.npmjs.org/'
})

test('Search Plugin', async () => {
  await pluginInstance.search('rubick-plugin-db', r => {
    expect(r.name).toBe('rubick-plugin-db')
  })
})

test('Install Plugin', async () => {
  await pluginInstance.install(['rubick-plugin-db'])
  expect(typeof (await pluginInstance.list())['rubick-plugin-db']).toBe(
    'string'
  )
})

test('Get Plugin', async () => {
  await pluginInstance.api('rubick-plugin-db')
})

// fs.rmSync(pluginDic, { recursive: true, force: true })

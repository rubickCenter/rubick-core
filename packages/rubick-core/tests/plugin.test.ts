import { PluginHandler } from '../src'
import path from 'path'
import os from 'os'

const pluginDic = path.join(os.tmpdir(), 'test-' + Date.now().toString())

const pluginInstance = new PluginHandler({
  baseDir: pluginDic,
  registry: 'https://registry.npmjs.org/'
})

describe('PluginHandler', () => {
  test('Search Plugin', async () => {
    await pluginInstance.search('rubick-plugin-db', r => {
      expect(r.name).toBe('rubick-plugin-db')
    })
  })

  test('Install Plugin', async () => {
    await pluginInstance.install('rubick-plugin-db')
    expect(typeof (await pluginInstance.list())['rubick-plugin-db']).toBe(
      'string'
    )
  }, 30000)

  test('Get Plugin API', async () => {
    expect(typeof (await pluginInstance.api('rubick-plugin-db'))).toBe('object')
  })
})

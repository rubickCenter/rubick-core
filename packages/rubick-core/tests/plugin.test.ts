import { PluginHandler } from '../src'
import path from 'path'
import os from 'os'

const pluginDic = path.join(os.tmpdir(), 'test-' + Date.now().toString())

const pluginInstance = new PluginHandler({
  baseDir: pluginDic,
  registry: 'https://registry.npm.taobao.org/',
  loglevel: 5
})

describe('PluginHandler', () => {
  test('Search Plugin', async () => {
    await pluginInstance.search('rubick-plugin-db', r => {
      expect(r.name).toBe('rubick-plugin-db')
    })
  })

  test('Install Plugin', async () => {
    await pluginInstance.install('rubick-plugin-db')
    expect((await pluginInstance.list())[0]).toBe('rubick-plugin-db')
  }, 30000)

  test('Update Plugin', async () => {
    await pluginInstance.update('rubick-plugin-db')
    expect((await pluginInstance.list())[0]).toBe('rubick-plugin-db')
  }, 30000)

  test('Get Plugin API', async () => {
    expect(typeof (await pluginInstance.api('rubick-plugin-db'))).toBe('object')
  })

  test('Stop all Plugin', async () => {
    await pluginInstance.stopAll()
    expect(pluginInstance.status.get('rubick-plugin-db')).toBe('STOPED')
  })

  test('Uninstall Plugin', async () => {
    await pluginInstance.uninstall('rubick-plugin-db')
    expect((await pluginInstance.list()).length).toBe(0)
  })
})

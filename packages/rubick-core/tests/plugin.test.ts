import { newAdapterHandler, AdapterHandler } from '../src'
import path from 'path'
import os from 'os'
import { env } from 'process'

const adapterHandlerConfig = {
  baseDir: path.join(os.tmpdir(), 'test-' + Date.now().toString()),
  registry:
    env.ACTION === undefined
      ? 'https://registry.npm.taobao.org'
      : 'https://registry.npmjs.org/',
  loglevel: 5
}

describe('AdapterHandler', () => {
  let adapterInstance: AdapterHandler

  test('New adapter handler instance', async () => {
    adapterInstance = await newAdapterHandler(adapterHandlerConfig)
  })

  test('Search adapter', async () => {
    await adapterInstance.search('rubick-adapter-db', r => {
      expect(r.name).toBe('rubick-adapter-db')
    })
  }, 30000)

  test('Get adapter info', async () => {
    const info = await adapterInstance.getAdapterInfo('rubick-adapter-db')
    expect(info.pluginName).toBe('rubick-adapter-db')
  }, 30000)

  test('Install adapter', async () => {
    await adapterInstance.install('rubick-adapter-db')
    expect((await adapterInstance.list())[0]).toBe('rubick-adapter-db')
  }, 30000)

  test('Update adapter', async () => {
    await adapterInstance.update('rubick-adapter-db')
    expect((await adapterInstance.list())[0]).toBe('rubick-adapter-db')
  }, 30000)

  test('Get adapter API', async () => {
    expect(typeof (await adapterInstance.api('rubick-adapter-db'))).toBe(
      'object'
    )
  })

  test('Stop all adapter', async () => {
    await adapterInstance.stop('rubick-adapter-db')
    expect(adapterInstance.status.get('rubick-adapter-db')).toBe('STOPED')
  })

  test('Uninstall adapter', async () => {
    await adapterInstance.uninstall('rubick-adapter-db')
    expect((await adapterInstance.list()).length).toBe(0)
  })
})

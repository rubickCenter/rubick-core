import { PluginHandler } from '../dist/index'
import path from 'path'
import fs from 'fs-extra'

const pluginDic = path.join(__dirname, 'tmp')

const pluginInstance = new PluginHandler({
	baseDir: pluginDic,
	registry: 'https://registry.npm.taobao.org',
})

test('Install Plugin', async () => {
	console.log(pluginInstance.baseDir)
	await pluginInstance.install(['rubick-plugin-demo'])
	expect(typeof pluginInstance.pluginList['rubick-plugin-demo']).toBe('string')
})

fs.rmSync(pluginDic, { recursive: true, force: true })

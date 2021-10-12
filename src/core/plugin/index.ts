import { PluginHandlerImp, Plugins } from './PluginHandlerImp'
import spawn from 'cross-spawn'
import fs from 'fs-extra'

class PluginHandler implements PluginHandlerImp {
	public baseDir: string
	public registry: string

	constructor(options: { baseDir: string; registry: string }) {
		this.baseDir = options.baseDir
		this.registry = options.registry || 'https://registry.npm.taobao.org'
	}

	async install(plugins: Plugins) {
		if (!(await fs.pathExists(this.baseDir))) {
			const pkgFilePath = `${this.baseDir}/package.json`
			fs.mkdirSync(this.baseDir)
			fs.writeFileSync(pkgFilePath, '{}')
		}
		await this.execCommand('install', plugins)
	}

	async update(plugins: Plugins) {
		await this.execCommand('install', plugins)
	}

	async uninstall(plugins: Plugins) {
		await this.execCommand('uninstall', plugins)
	}

	get pluginList() {
		const installInfo: string = fs.readFileSync(`${this.baseDir}/package.json`, 'utf-8')
		return JSON.parse(installInfo).dependencies
	}

	async execCommand(cmd: string, modules: Array<string>) {
		// options first
		return await new Promise((resolve, reject) => {
			let args: Array<string> = [cmd]
				.concat(modules)
				.concat('--color=always')
				.concat('--save')
			args = args.concat(`--registry=${this.registry}`)
			try {
				const npm = spawn('npm', args, { cwd: this.baseDir })

				// for users who haven't installed node.js
				npm.on('error', (err: any) => {
					reject(err)
				})

				npm.on('end', (msg: any) => {
					resolve(msg)
				})
			} catch (e) {
				reject(e)
			}
		})
	}
}

export { PluginHandler }

const spawn = require('cross-spawn');
const process = require('child_process')
const fs = require('fs')

const {existOrNot} = require('../helpers');

class PluginHandler {
  constructor(options) {
    this.baseDir = options.baseDir;
    this.registry = options.registry || 'https://registry.npm.taobao.org';
  }

  async install(plugins) {
    if (!await existOrNot(this.baseDir)) {
      const pkgFilePath = `${this.baseDir}/package.json`;
      fs.mkdirSync(this.baseDir);
      fs.writeFileSync(pkgFilePath, '{}');
    }
    await this.execCommand('install', plugins);
  }

  async update(plugins) {
    await this.execCommand('install', plugins);
  }

  async uninstall(plugins) {
    await this.execCommand('uninstall', plugins);
  }

  get pluginList() {
    const installInfo = fs.readFileSync(`${this.baseDir}/package.json`);
    return JSON.parse(installInfo).dependencies;
  }

  async execCommand(cmd, modules) {
    // options first
    return await new Promise((resolve, reject) => {
      let args = [cmd].concat(modules).concat('--color=always').concat('--save')
      args = args.concat(`--registry=${this.registry}`)
      try {
        const npm = spawn('npm', args, {cwd: this.baseDir})

        // for users who haven't installed node.js
        npm.on('error', (err) => {
          reject(err);
        })
      } catch (e) {
        reject(e);
      }
    })
  }
}

module.exports = PluginHandler

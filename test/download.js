const rubickCore = require('../lib/index');
const path = require('path');

const pluginInstance = new rubickCore.PluginHandler({
  baseDir: path.join(__dirname, './plugin')
});

console.log(path.join(__dirname, './plugin'));

pluginInstance.install(['rubick-plugin-demo'])
// console.log(pluginInstance.pluginList)

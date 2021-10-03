## API 设计

### 插件类 `Class PluginHandler`

```js
const { PluginHandler } = require('@rubick/rubick-core')

const pluginInstance = new PluginHandler({
	baseDir: path.join(__dirname, './plugin'),
})
```

#### 实例方法

##### 1. install

从 `npm` 上安装插件

```js
pluginInstance.install(plugins)
```

**eg:**

```js
pluginInstance.install(['rubick-plugin-demo'])
```

##### 2. uninstall

卸载插件

```js
pluginInstance.uninstall(plugins)
```

**eg:**

```js
pluginInstance.uninstall(['rubick-plugin-demo'])
```

##### 3. update

更新插件，需带具体的版本号

```js
pluginInstance.update(plugins)
```

**eg:**

```js
pluginInstance.update(['rubick-plugin-demo@0.1.1'])
```

### 系统插件使用 `Class SysPluginHandler`

系统插件生存于 `rubick` 工具的完整生命周期，也就是说只要 `rubick` 在使用，
系统插件也会一直运行。

```js
const { SysPluginHandler } = require('@rubick/rubick-core')

const sysPluginHandler = new SysPluginHandler(options)
```

#### 实例方法

##### 1. register

将插件注册到系统

```js
sysPluginHandler.register(pluginName, pluginPath)
```

##### 2. mainLoad

主进程运行系统插件所有主进程函数，该方法在主进程中调用

```js
sysPluginHandler.mainLoad()
```

##### 2. rendererLoad

渲染进程运行系统插件所有渲染进程函数，该方法在渲染进程中调用

```js
sysPluginHandler.rendererLoad()
```

## 贡献指南

项目采用全自动化的代码检查与构建, 使用以下命令进行开发即可

Action Command
Install · npm install
Build · npm run build
Commit & Release · npm run ok

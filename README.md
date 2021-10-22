# RubickCore

rubick 的插件能力系统

rubickcore 可通过安装系统插件, 动态获得任何能力

## API 设计

### 插件类 `Class PluginHandler`

```js
const { PluginHandler } = require('@rubick/rubick-core')

const pluginInstance = new PluginHandler({
  // 插件安装目录
  baseDir: path.join(__dirname, './plugin')
})
```

#### 实例方法

##### 1. install

从 `npm` 上安装插件

```js
pluginInstance.install(plugin1, plugin2, plugin3)
```

**eg:**

```js
pluginInstance.install('rubick-plugin-demo')
```

##### 2. uninstall

卸载插件

```js
pluginInstance.uninstall(plugin1, plugin2, plugin3)
```

**eg:**

```js
pluginInstance.uninstall('rubick-plugin-demo')
```

##### 3. update

更新插件，需带具体的版本号

```js
pluginInstance.update(plugin1, plugin2, plugin3)
```

**eg:**

```js
pluginInstance.update('rubick-plugin-demo@0.1.1')
```

##### 4. search

搜索插件

```js
pluginInstance.search(plugin)
```

**eg:**

```js
pluginInstance.search('rubick-plugin-demo')
```

## 系统插件开发

系统插件需要在入口文件暴露插件对象

系统插件可在构造函数 `constructor` 中设置插件配置, 配置参数均为**可选**参数

插件所有输出都会被重定向到全局日志器中

系统插件必须有几个生命周期函数:

| 函数名称 | 作用                 |
| -------- | -------------------- |
| start    | · 启动插件时被调用   |
| stop     | · 关闭插件时被调用   |
| api      | · 获取插件功能时调用 |

**eg:**

```js
export default class PluginDB {
  constructor(options: { dbPath?: string, dbName?: string }) {
    if (dbPath === undefined) throw new Error('必须指定参数 dbPath')
    this.options = options
  }

  async start() {
    this.localdb = new Localdb(this.opt)
  }

  async stop() {
    await this.localdb.stop()
  }

  async api() {
    return await this.localdb.api()
  }
}
```

## 贡献指南

项目采用全自动化的代码检查与构建, 使用以下命令进行开发即可

| Action           | Command        |
| ---------------- | -------------- |
| Install          | · `pnpm i`     |
| Build            | · `pnpm build` |
| Commit & Release | · `pnpm ok`    |

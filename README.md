# RubickCore

rubick 的插件能力系统

rubickcore 可通过安装系统插件, 动态获得任何能力, 以此驱动 rubick 创造无限可能

rubick 的底层能力由以下系统插件提供:

1. [rubick-adapter-db](./packages/rubick-adapter-db) 提供本地数据储存
2. [rubick-adapter-appsearch](./packages/rubick-adapter-appsearch) 提供系统应用搜索
3. [rubick-adapter-nut](./packages/rubick-adapter-nut) 提供模拟和截图功能

## 系统插件开发

你可以使用 [rubick-cli](https://github.com/rubickCenter/rubick-cli) 来基于模版自动初始化项目

系统插件开发有以下几个约定:

1. 系统插件需要在入口文件暴露插件对象

2. 系统插件可在构造函数 `constructor` 中设置插件配置, 配置参数均为**可选**参数

3. 插件包名前戳为 `rubick-adapter-`

4. 系统插件必须有几个生命周期函数:

| 函数名称 | 作用                 |
| -------- | -------------------- |
| start    | · 启动插件时被调用   |
| stop     | · 关闭插件时被调用   |
| api      | · 获取插件功能时调用 |

**eg:**

```js
export default class MyAdapter {
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

## rubickcore 接入文档

### 系统插件类 `Class AdapterHandler`

```js
const { newAdapterHandler } = require('@rubick/rubick-core')

const rubickcore = newAdapterHandler({
  // 插件安装目录
  baseDir: path.join(__dirname, './adapter')
})
```

#### 实例方法

##### 1. install

从 `npm` 上安装插件

```js
rubickcore.install(adapter1, adapter2, adapter3)
```

**eg:**

```js
rubickcore.install('rubick-adapter-db')
```

##### 2. uninstall

卸载插件

```js
rubickcore.uninstall(adapter1, adapter2, adapter3)
```

**eg:**

```js
rubickcore.uninstall('rubick-adapter-db')
```

##### 3. update

更新插件，需带具体的版本号

```js
rubickcore.update(adapter1, adapter2, adapter3)
```

**eg:**

```js
rubickcore.update('rubick-adapter-db@0.0.2')
```

##### 4. search

搜索插件

```js
rubickcore.search(adapter)
```

**eg:**

```js
rubickcore.search('rubick-adapter-db')
```

##### 5. api

获取插件能力

```js
rubickcore.api(adapter)
```

**eg:**

```js
rubickcore.api('rubick-adapter-db')
```

## 贡献指南

项目采用全自动化的代码检查与构建, 使用以下命令进行开发即可

| Action           | Command        |
| ---------------- | -------------- |
| Install          | · `pnpm i`     |
| Build            | · `pnpm build` |
| Commit & Release | · `pnpm ok`    |

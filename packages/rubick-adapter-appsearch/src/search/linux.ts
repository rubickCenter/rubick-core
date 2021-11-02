import translate from '../translate'

const isZhRegex = /[\u4e00-\u9fa5]/

interface AppObject {
  name: string
  icon_path: string[]
  description: string
  command: string
  desktop_entry_path: string
}

const ns = (name: string) => {
  const result = []
  if (name && isZhRegex.test(name)) {
    const py = translate(name)
    const pinyinArr = py.split(',')
    const firstLatter = pinyinArr.map(py => py[0])
    // 拼音
    result.push(pinyinArr.join(''))
    // 缩写
    result.push(firstLatter.join(''))
    // 中文
    result.push(name)
  }
  return JSON.parse(JSON.stringify(result))
}

export default (appList: string[]) =>
  appList
    .map(app => JSON.parse(app))
    .map((app: AppObject) => ({
      value: 'plugin',
      desc: app.description,
      type: 'app',
      // todo 找到适合的图标
      icon: app.icon_path !== null ? app.icon_path[0] : '',
      action: app.command,
      keyWords: app.name.split(' '),
      name: app.name,
      names: ns(app.name)
    }))

import lnkParser from 'win-lnk-parser'
import translate from '../translate'
import path from 'path'
const isZhRegex = /[\u4e00-\u9fa5]/

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

export default async (lnkPath: string) => {
  const { targetPath, iconLocation, description } = await lnkParser(lnkPath)
  const appName = path.parse(lnkPath).name
  const keywds = ns(appName)
  return {
    value: 'plugin',
    desc: description,
    type: 'app',
    icon: iconLocation,
    action: `start "dummyclient" "${targetPath as string}"`,
    keyWords: keywds,
    name: lnkPath,
    names: keywds
  }
}

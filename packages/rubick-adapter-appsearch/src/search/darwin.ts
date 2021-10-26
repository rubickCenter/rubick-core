import getMacApps from 'get-mac-apps'
import fs from 'fs'
import path from 'path'

import translate from '../translate'

const isZhRegex = /[\u4e00-\u9fa5]/

async function getAppIcon(
  appPath: string,
  nativeImage: {
    createThumbnailFromPath: (
      iconPath: string,
      size: { width: number; height: number }
    ) => { toDataURL: () => string }
  }
): Promise<string | null> {
  try {
    const appName: string = appPath.split('/').pop() ?? ''
    const extname: string = path.extname(appName)
    const appSubStr: string = appName.split(extname)[0]
    const path1 = path.join(appPath, `/Contents/Resources/App.icns`)
    const path2 = path.join(appPath, `/Contents/Resources/AppIcon.icns`)
    const path3 = path.join(appPath, `/Contents/Resources/${appSubStr}.icns`)
    const path4 = path.join(
      appPath,
      `/Contents/Resources/${appSubStr.replace(' ', '')}.icns`
    )
    let iconPath: string = path1
    if (fs.existsSync(path1)) {
      iconPath = path1
    } else if (fs.existsSync(path2)) {
      iconPath = path2
    } else if (fs.existsSync(path3)) {
      iconPath = path3
    } else if (fs.existsSync(path4)) {
      iconPath = path4
    } else {
      // 性能最低的方式
      const resourceList = fs.readdirSync(
        path.join(appPath, `/Contents/Resources`)
      )
      const iconName = resourceList.filter(
        file => path.extname(file) === '.icns'
      )[0]
      iconPath = path.join(appPath, `/Contents/Resources/${iconName}`)
    }
    const img = await nativeImage.createThumbnailFromPath(iconPath, {
      width: 64,
      height: 64
    })

    return img.toDataURL()
  } catch (e) {
    return null
  }
}

export default async (nativeImage: any): Promise<AppPlugin[]> => {
  let apps = await getMacApps.getApps()

  apps = apps.filter((app: any) => {
    const extname = path.extname(app.path)
    return extname === '.app' || extname === '.prefPane'
  })
  for (const app of apps) {
    app.icon = await getAppIcon(app.path, nativeImage)
    // todo getApp size
  }
  apps = apps.filter((app: any) => !!app.icon)

  apps = apps.map((app: any) => {
    const appName: any = app.path.split('/').pop()
    const extname = path.extname(appName)
    const appSubStr = appName.split(extname)[0]
    let fileOptions: AppPlugin = {
      ...app,
      value: 'plugin',
      desc: app.path,
      type: 'app',
      action: `open ${app.path.replace(' ', '\\ ') as string}`,
      keyWords: [appSubStr]
    }

    if (app._name && isZhRegex.test(app._name)) {
      const py = translate(app._name)
      const pinyinArr = py.split(',')
      const firstLatter = pinyinArr.map(py => py[0])
      // 拼音
      fileOptions.keyWords.push(pinyinArr.join(''))
      // 缩写
      fileOptions.keyWords.push(firstLatter.join(''))
      // 中文
      fileOptions.keyWords.push(app._name)
    }

    fileOptions = {
      ...fileOptions,
      name: app._name,
      names: JSON.parse(JSON.stringify(fileOptions.keyWords))
    }
    return fileOptions
  })

  return apps
}

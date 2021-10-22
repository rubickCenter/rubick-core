declare module 'get-mac-apps'

interface AppPlugin {
  _name: string
  keyWords: string[]
  [k: string]: string | number | string[]
}

declare module 'get-mac-apps'

declare type AppPlugin = {
  _name: string,
  keyWords: Array<string>,
  [k: string]: string | number | Array<any>
}

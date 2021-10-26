import { SyncDB } from '../src'

const db = new SyncDB('testdoc')
const map = db.newMap('testmap')

describe('p2p', () => {
  test('curd', async () => {
    const time = Date.now()
    map.set('test', time)
    expect(map.has('test')).toBe(true)

    expect(map.size).toBe(1)

    map.del('test')
    expect(map.has('test')).toBe(false)

    map.set('test', time)
    map.clear()
    expect(map.size).toBe(0)
  })
})

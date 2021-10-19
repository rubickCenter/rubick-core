import { Localdb } from '../packages/core'
import path from 'path'
import fs from 'fs-extra'
if (!fs.pathExistsSync(path.join(__dirname, 'tmp'))) {
  fs.mkdirSync(path.join(__dirname, 'tmp'))
}

const dbPath = path.join(__dirname, 'tmp', 'db')

const db = new Localdb(dbPath)

db.init()

describe('db', () => {
  test('put', async () => {
    const id = Date.now()
    const result = await db.put('test', {
      _id: `demo_${id}`,
      data: 'demo'
    })
    // @ts-ignore
    if ('id' in result) {
      expect(result.id).toBe(`demo_${id}`)
    }
  })

  test('update', async () => {
    const id = Date.now()

    const result = await db.put('test', {
      _id: `demo_${id}`,
      data: 'demo'
    })

    await db.put('test', {
      _id: `demo_${id}`,
      data: 'demo update',
      // @ts-ignore
      _rev: result.rev
    })

    const target = await db.get('test', `demo_${id}`)

    // @ts-ignore
    expect(target.data).toBe('demo update')
  })
})

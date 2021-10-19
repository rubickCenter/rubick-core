import { Localdb } from '../src'
import path from 'path'

const dbPath = path.join(__dirname, 'tmp')

const db = new Localdb(dbPath)

db.init()

describe('db', () => {
  test('put', async () => {
    const id = Date.now()
    const result = await db.put('test', {
      _id: `demo_${id}`,
      data: 'demo'
    })
    // @ts-expect-error test
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
      // @ts-expect-error test
      _rev: result.rev
    })

    const target = await db.get('test', `demo_${id}`)

    // @ts-expect-error test
    expect(target.data).toBe('demo update')
  })
})

import Localdb from '../src'
import path from 'path'
import { DocRes } from '../src/types'

const dbPath = path.join(__dirname, 'tmp')

const db = new Localdb(dbPath)

describe('db', () => {
  test('start', async () => {
    await db.start()
  })

  test('put', async () => {
    const dbapi = await db.api('test')
    const id = Date.now()
    const result = (await dbapi.put({
      _id: `demo_${id}`,
      data: 'demo'
    })) as DocRes

    expect(result._id).toBe(`demo_${id}`)
  })

  test('update', async () => {
    const dbapi = await db.api('test')
    const id = Date.now()
    const result = (await dbapi.put({
      _id: `demo_${id}`,
      data: 'demo'
    })) as DocRes

    await dbapi.put({
      _id: `demo_${id}`,
      data: 'demo update',
      _rev: result.rev
    })

    const target = (await dbapi.get(`demo_${id}`)) ?? { data: '' }

    expect(target.data).toBe('demo update')
  })

  test('close', async () => {
    await db.close()
  })
})

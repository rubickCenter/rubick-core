import PluginDB from '../src'
import path from 'path'
import { DocRes } from '../src/types'

const dbPath = path.join(__dirname, 'tmp')

const db = new PluginDB({ dbPath })

describe('db', () => {
  test('start', async () => {
    await db.start()
  })

  test('put', async () => {
    const dbapi = await db.api()
    const id = Date.now()
    const result = (await dbapi.put('test', {
      _id: `demo_${id}`,
      data: 'demo'
    })) as DocRes

    expect(result._id).toBe(`demo_${id}`)
  })

  test('update', async () => {
    const dbapi = await db.api()
    const id = Date.now()
    const result = (await dbapi.put('test', {
      _id: `demo_${id}`,
      data: 'demo'
    })) as DocRes

    await dbapi.put('test', {
      _id: `demo_${id}`,
      data: 'demo update',
      _rev: result.rev
    })

    const target = (await dbapi.get('test', `demo_${id}`)) ?? { data: '' }

    expect(target.data).toBe('demo update')
  })

  test('close', async () => {
    await db.stop()
  })
})

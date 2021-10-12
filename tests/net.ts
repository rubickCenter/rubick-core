import { request } from '../src/core'

test('Cross origin fetch', async () => {
	expect((await request.get('https://github.com/')).statusCode).toBe(200)
})

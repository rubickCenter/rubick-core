import { request } from '../dist/core/net'

test('Cross origin fetch', async () => {
	expect((await request.get('https://baidu.com')).statusCode).toBe(200)
})

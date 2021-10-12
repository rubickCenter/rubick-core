import { fs, path } from '../src/core'

test('path & fs api with extra', async () => {
	expect(typeof fs.readJsonSync(path.join(__dirname, '../package.json'))['name']).toBe('string')
})

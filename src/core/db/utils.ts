/** Rubick database
 * @abstract
 * @class RubickDB
 */
abstract class BaseDocument {
	name: string
	constructor(opt: DocOptions) {
		const { name } = opt
		this.name = name
	}
}

interface DocOptions {
	name: string
}

export {BaseDocument}
export type { DocOptions }


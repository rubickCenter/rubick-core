const pluginSchema = {
	title: 'plugin schema',
	version: 0,
	description: 'plugin meta data',
	primaryKey: 'uuid',
	type: 'object',
	properties: {
		uuid: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
		installed: {
			type: 'boolean',
			default: false,
		},
		sync: {
			type: 'boolean',
			default: false,
		},
	},
	required: ['uuid', 'name'],
}

const userSchema = {
	title: 'user schema',
	version: 0,
	description: 'user personal data',
	primaryKey: 'uuid',
	type: 'object',
	properties: {
		uuid: {
			type: 'string',
		},
		username: {
			type: 'string',
		},
		settings: {
			type: 'object',
			properties: {
				main: {
					type: 'string',
				},
			},
		},
		data: {
			type: 'object',
			properties: {
				plugins: {
					type: 'string',
				},
			},
		},
	},
	required: ['uuid', 'username', 'settings'],
}

export { pluginSchema, userSchema }

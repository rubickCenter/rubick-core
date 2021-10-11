export interface Doc {
	_id: string
	data: string
	_rev?: string
	_attachments?: string
}

export interface DocRes {
	id: string
	_id: string
	ok: boolean
	rev: string
}

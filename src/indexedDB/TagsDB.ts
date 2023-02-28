import { toJS } from 'mobx';

import { ITag } from '../stores/models/ITag';
import { IndexedDB } from './IndexedDB';

class TagsDB extends IndexedDB {
	async saveTag(tag: ITag): Promise<void> {
		const db = await this.getDB();

		await db.put('tags', toJS(tag));
	}

	async retrieveAllTags(): Promise<ITag[]> {
		const db = await this.getDB();

		return await db.getAll('tags');
	}

	async deleteTag(id: number): Promise<void> {
		const db = await this.getDB();

		await db.delete('tags', id);
	}

	async clearAllTags(): Promise<void> {
		const db = await this.getDB();

		await db.clear('tags');
	}
}

const tagsDB = new TagsDB();
export default tagsDB;

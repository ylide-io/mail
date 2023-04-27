import { toJS } from 'mobx';

import { DBTable, IndexedDB, ITag } from '../IndexedDB';

class TagsDB extends IndexedDB {
	async saveTag(tag: ITag): Promise<void> {
		const db = await this.getDB();

		await db.put(DBTable.TAGS, toJS(tag));
	}

	async retrieveAllTags(): Promise<ITag[]> {
		const db = await this.getDB();

		return await db.getAll(DBTable.TAGS);
	}

	async deleteTag(id: number): Promise<void> {
		const db = await this.getDB();

		await db.delete(DBTable.TAGS, id);
	}

	async clearAllTags(): Promise<void> {
		const db = await this.getDB();

		await db.clear(DBTable.TAGS);
	}
}

const tagsDB = new TagsDB();
export default tagsDB;

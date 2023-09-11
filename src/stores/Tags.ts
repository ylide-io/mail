import { makeAutoObservable } from 'mobx';

import tagsDB from '../indexedDB/impl/TagsDB';
import { ITag } from '../indexedDB/IndexedDB';
import { colors } from '../utils/colors';

class Tags {
	tags: ITag[] = [];
	newTag: ITag | null = null;

	constructor() {
		makeAutoObservable(this);
	}

	init() {
		tagsDB.retrieveAllTags().then(res => {
			this.tags = res.reverse();
		});
	}

	async saveTag(tag: ITag): Promise<void> {
		this.tags.unshift(tag);
		await tagsDB.saveTag(tag);
	}

	async updateTag(tag: ITag): Promise<void> {
		this.tags = this.tags.map(elem => {
			if (elem.id !== tag.id) {
				return elem;
			} else {
				return tag;
			}
		});
		await tagsDB.saveTag(tag);
	}

	async deleteTag(id: number): Promise<void> {
		this.tags = this.tags.filter(elem => elem.id !== id);
		await tagsDB.deleteTag(id);
	}

	getTagsFromIds = (tagsIds: number[]) => {
		const tags: ITag[] = [];

		tagsIds.forEach(id => {
			const tag = this.tags.find(elem => elem.id === id);
			if (tag) {
				tags.push(tag);
			}
		});

		return tags;
	};

	generateNewTag() {
		this.newTag = {
			id: Date.now(),
			color: colors.primary,
			name: '',
			icon: '',
		};
	}

	resetNewTag() {
		this.newTag = null;
	}
}

const tags = new Tags();
export default tags;

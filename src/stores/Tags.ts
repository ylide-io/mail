import { makeAutoObservable } from "mobx";
import { ITag } from "./models/ITag";
import tagsDB from "../indexedDB/TagsDB";
import { colors } from "../utils/colors";

class Tags {
    tags: ITag[] = [];
    newTag: ITag | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    async getTags(): Promise<ITag[]> {
        if (!this.tags.length) {
            await this.retrieveTags();
        }
        return this.tags;
    }

    async retrieveTags(): Promise<void> {
        const dbTags = await tagsDB.retrieveAllTags();
        this.tags = dbTags.reverse();
    }

    async saveTag(tag: ITag): Promise<void> {
        this.tags.unshift(tag);
        await tagsDB.saveTag(tag);
    }

    async updateTag(tag: ITag): Promise<void> {
        this.tags = this.tags.map((elem) => {
            if (elem.id !== tag.id) {
                return elem;
            } else {
                return tag;
            }
        });
        await tagsDB.saveTag(tag);
    }

    async deleteTag(id: number): Promise<void> {
        this.tags = this.tags.filter((elem) => elem.id !== id);
        await tagsDB.deleteTag(id);
    }

    getTagsFromIds = (tagsIds: number[]) => {
        const tags: ITag[] = [];

        tagsIds.forEach((id) => {
            const tag = this.tags.find((elem) => elem.id === id);
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
            name: "",
        };
    }

    resetNewTag() {
        this.newTag = null;
    }
}

const tags = new Tags();
export default tags;

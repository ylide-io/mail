// @ts-ignore
// eslint-disable-next-line simple-import-sort/imports
import List from '@editorjs/list';
import Header from '@editorjs/header';
import { toJS } from 'mobx';
import { nanoid } from 'nanoid';
import { OutputData } from '@editorjs/editorjs';

export const EDITOR_JS_TOOLS = {
	list: List,
	header: Header,
};

export function decodeEditorData(data: any): OutputData | undefined {
	try {
		return typeof data === 'string' ? JSON.parse(data) : toJS(data);
	} catch (e) {}
}

export const generateEditorJsId = () => nanoid(10);

export function plainTextToEditorData(text: string): OutputData {
	return {
		blocks: text.split('\n').map(line => ({
			id: generateEditorJsId(),
			type: 'paragraph',
			data: {
				text: line,
			},
		})),
	};
}

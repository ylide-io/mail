// @ts-ignore
// eslint-disable-next-line simple-import-sort/imports
import List from '@editorjs/list';
import Header from '@editorjs/header';
import { toJS } from 'mobx';

export const EDITOR_JS_TOOLS = {
	list: List,
	header: Header,
};

export function decodeEditorData(data: any) {
	try {
		return typeof data === 'string' ? JSON.parse(data) : toJS(data);
	} catch (e) {
		return null;
	}
}

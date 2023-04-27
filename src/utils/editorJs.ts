// @ts-ignore
// eslint-disable-next-line simple-import-sort/imports
import List from '@editorjs/list';
import Header from '@editorjs/header';
import { toJS } from 'mobx';
import { nanoid } from 'nanoid';
import { OutputData } from '@editorjs/editorjs';
import { IMessageDecodedTextData, MessageDecodedTextDataType } from '../indexedDB/IndexedDB';
import { IYMFTagNode, YMF } from '@ylide/sdk';

export const EDITOR_JS_TOOLS = {
	list: List,
	header: Header,
};

function decodeEditorJsData(data: string): OutputData | undefined {
	let json: OutputData | undefined;

	try {
		json = typeof data === 'string' ? JSON.parse(data) : toJS(data);
	} catch (e) {}

	const isQamonMessage = !json?.blocks;
	return isQamonMessage
		? {
				time: 1676587472156,
				blocks: [{ id: '2cC8_Z_Rad', type: 'paragraph', data: { text: (json as any).body } }],
				version: '2.26.5',
		  }
		: json;
}

function generateEditorJsId() {
	return nanoid(10);
}

export function plainTextToEditorJsData(text: string): OutputData {
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

export function decodedTextDataToEditorJsData(
	decodedTextData: IMessageDecodedTextData | undefined,
): OutputData | undefined {
	if (!decodedTextData) return;

	if (decodedTextData.type === MessageDecodedTextDataType.YMF) {
		return ymfToEditorJs(decodedTextData.value);
	} else {
		return decodeEditorJsData(decodedTextData.value);
	}
}

export function decodedTextDataToPlainText(decodedTextData: IMessageDecodedTextData | undefined): string | undefined {
	if (!decodedTextData) return;

	if (decodedTextData.type === MessageDecodedTextDataType.YMF) {
		return decodedTextData.value.toPlainText();
	} else {
		const data = decodeEditorJsData(decodedTextData.value);
		return data?.blocks.map((b: any) => b.data.text).join('\n');
	}
}

export function parseEditorJsJson(json: any) {
	try {
		json = typeof json === 'string' ? JSON.parse(json) : json;
	} catch (e) {
		return typeof json === 'string' ? json : JSON.stringify(json);
	}
	let result = '';

	for (const block of json.blocks) {
		if (block.type === 'paragraph') {
			result += block.data.text + '\n';
		} else if (block.type === 'header') {
			result += '#'.repeat(block.data.level) + ' ' + block.data.text + '\n';
		} else if (block.type === 'list') {
			let i = 1;
			for (const item of block.data.items) {
				result += (block.data.style === 'ordered' ? `${i}. ` : '- ') + item + '\n';
				i++;
			}
		} else if (block.type === 'delimiter') {
			result += '\n';
		} else if (block.type === 'image') {
			result += block.data.caption + '\n';
		} else if (block.type === 'embed') {
			result += block.data.caption + '\n';
		} else if (block.type === 'table') {
			result += block.data.caption + '\n';
		} else if (block.type === 'quote') {
			result += block.data.caption + '\n';
		} else if (block.type === 'code') {
			result += block.data.caption + '\n';
		} else if (block.type === 'raw') {
			result += block.data.caption + '\n';
		} else if (block.type === 'warning') {
			result += block.data.caption + '\n';
		} else if (block.type === 'linkTool') {
			result += block.data.caption + '\n';
		} else if (block.type === 'marker') {
			result += block.data.caption + '\n';
		} else if (block.type === 'checklist') {
			result += block.data.caption + '\n';
		} else if (block.type === 'inlineCode') {
			result += block.data.caption + '\n';
		} else if (block.type === 'simpleImage') {
			result += block.data.caption + '\n';
		} else if (block.type === 'underline') {
			result += block.data.caption + '\n';
		} else if (block.type === 'strikethrough') {
			result += block.data.caption + '\n';
		} else if (block.type === 'superscript') {
			result += block.data.caption + '\n';
		} else if (block.type === 'subscript') {
			result += block.data.caption + '\n';
		} else if (block.type === 'link') {
			result += block.data.caption + '\n';
		} else if (block.type === 'alignment') {
			result += block.data.caption + '\n';
		} else if (block.type === 'rawTool') {
			result += block.data.caption + '\n';
		} else if (block.type === 'del') {
			result += block.data.caption + '\n';
		} else if (block.type === 'inlineLink') {
			result += block.data.caption + '\n';
		} else if (block.type === 'mention') {
			result += block.data.caption + '\n';
		}
	}

	return result.replaceAll('<br>', '\n');
}

export function editorJsToYMF(json: any) {
	const nodes: string[] = [];
	for (const block of json.blocks) {
		if (block.type === 'paragraph') {
			nodes.push(`<p ejs-id="${block.id}">${block.data.text}</p>`); // data.text
		} else if (block.type === 'header') {
			// data.level -- number
			// data.text -- string
			nodes.push(`<h${block.data.level} ejs-id="${block.id}">${block.data.text}</h${block.data.level}>`);
		} else if (block.type === 'list') {
			// data.style: 'ordered' | 'unordered'
			// data.items: string[]
			if (block.data.style === 'ordered') {
				const innerNodes: string[] = [];
				for (let i = 0; i < block.data.items.length; i++) {
					innerNodes.push(`<li><ejs-bullet>${i + 1}. </ejs-bullet>${block.data.items[i]}</li>`);
				}
				nodes.push(`<ol ejs-id="${block.id}">${innerNodes.join('\n')}</ol>`);
			} else if (block.data.style === 'unordered') {
				const innerNodes: string[] = [];
				for (let i = 0; i < block.data.items.length; i++) {
					innerNodes.push(`<li><ejs-bullet>• </ejs-bullet>${block.data.items[i]}</li>`);
				}
				nodes.push(`<ul ejs-id="${block.id}">${innerNodes.join('\n')}</ul>`);
			}
		} else {
			// nothing
		}
	}
	return YMF.fromYMFText(`<editorjs>${nodes.join('\n')}</editorjs>`);
}

export function ymfToEditorJs(ymf: YMF) {
	if (
		!ymf ||
		ymf.root.children.length !== 1 ||
		ymf.root.children[0].type !== 'tag' ||
		ymf.root.children[0].tag !== 'editorjs'
	)
		return {
			time: 1676587472156,
			blocks: [{ id: '2cC8_Z_Rad', type: 'paragraph', data: { text: ymf.toPlainText() } }],
			version: '2.26.5',
		};

	const root: IYMFTagNode = ymf.root.children[0];
	const blocks: any[] = [];
	for (const child of root.children) {
		if (child.type === 'text') {
			// do nothing, skip line breaks
		} else if (child.type === 'tag') {
			if (child.tag === 'p') {
				blocks.push({
					id: child.attributes['ejs-id'],
					type: 'paragraph',
					data: {
						text: child.children.map(c => YMF.nodeToYMFText(c)).join(''),
					},
				});
			} else if (child.tag.startsWith('h')) {
				const level = parseInt(child.tag[1], 10);
				blocks.push({
					id: child.attributes['ejs-id'],
					type: 'header',
					data: {
						text: child.children.map(c => YMF.nodeToYMFText(c)).join(''),
						level,
					},
				});
			} else if (child.tag === 'ol') {
				blocks.push({
					id: child.attributes['ejs-id'],
					type: 'list',
					data: {
						style: 'ordered',
						items: child.children
							.filter(c => c.type === 'tag')
							.map(c =>
								(c as IYMFTagNode).children
									.slice(1)
									.map(c => YMF.nodeToYMFText(c))
									.join(''),
							),
					},
				});
			} else if (child.tag === 'ul') {
				blocks.push({
					id: child.attributes['ejs-id'],
					type: 'list',
					data: {
						style: 'unordered',
						items: child.children
							.filter(c => c.type === 'tag')
							.map(c =>
								(c as IYMFTagNode).children
									.slice(1)
									.map(c => YMF.nodeToYMFText(c))
									.join(''),
							),
					},
				});
			} else {
				// do nothing
			}
		}
	}

	return {
		time: 1676587472156,
		blocks,
		version: '2.26.5',
	};
}

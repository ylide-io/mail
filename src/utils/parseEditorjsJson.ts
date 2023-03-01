export const parseEditorjsJson = (json: any) => {
	try {
		json = typeof json === 'string' ? JSON.parse(json) : json;
	} catch (e) {
		return typeof json === 'string' ? json : JSON.stringify(json);
	}
	let result = '';

	for (const block of json.blocks) {
		if (block.type === 'paragraph') {
			result += block.data.text + "\n";
		} else
		if (block.type === 'header') {
			result += '#'.repeat(block.data.level) + ' ' + block.data.text + "\n";
		} else
		if (block.type === 'list') {
			let i = 1;
			for (const item of block.data.items) {
				result += (block.data.style === 'ordered' ? `${i}. ` : '- ') + item + "\n";
				i++;
			}
		} else
		if (block.type === 'delimiter') {
			result += "\n";
		} else
		if (block.type === 'image') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'embed') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'table') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'quote') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'code') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'raw') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'warning') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'linkTool') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'marker') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'checklist') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'inlineCode') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'simpleImage') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'underline') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'strikethrough') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'superscript') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'subscript') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'link') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'alignment') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'rawTool') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'del') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'inlineLink') {
			result += block.data.caption + "\n";
		} else
		if (block.type === 'mention') {
			result += block.data.caption + "\n";
		}
	}

	return result.replaceAll('<br>', "\n");
};
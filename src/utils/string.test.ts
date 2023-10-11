import { htmlSelfClosingTagsToXHtml, transformMatches, truncateAddress, truncateInMiddle } from './string';

test('truncateInMiddle', () => {
	expect(truncateInMiddle('1234567890', 10)).toBe('1234567890');
	expect(truncateInMiddle('1234567890', 5)).toBe('12390');
	expect(truncateInMiddle('1234567890', 2)).toBe('10');
	expect(truncateInMiddle('1234567890', 1)).toBe('1');
	expect(truncateInMiddle('1234567890', 0)).toBe('1');

	expect(truncateInMiddle('1234567890', 10, '..')).toBe('1234567890');
	expect(truncateInMiddle('1234567890', 5, '..')).toBe('123..90');
	expect(truncateInMiddle('1234567890', 2, '..')).toBe('1..0');
	expect(truncateInMiddle('1234567890', 1, '..')).toBe('1..0');
	expect(truncateInMiddle('1234567890', 0, '..')).toBe('1..0');
});

test('truncateAddress', () => {
	expect(truncateAddress('1234567890', 4)).toBe('12..90');
	expect(truncateAddress('0x1234567890', 4)).toBe('0x12..90');
	expect(truncateAddress('0:1234567890', 4)).toBe('0:12..90');
});

test('htmlSelfClosingTagsToXHtml', () => {
	expect(htmlSelfClosingTagsToXHtml('<img>')).toBe('<img />');
	expect(htmlSelfClosingTagsToXHtml('<img/>')).toBe('<img />');
	expect(htmlSelfClosingTagsToXHtml('<img />')).toBe('<img />');
	expect(htmlSelfClosingTagsToXHtml('<img >')).toBe('<img />');

	expect(htmlSelfClosingTagsToXHtml('<img src="url">')).toBe('<img src="url" />');
	expect(htmlSelfClosingTagsToXHtml('<img src="url"/>')).toBe('<img src="url" />');
	expect(htmlSelfClosingTagsToXHtml('<img src="url" />')).toBe('<img src="url" />');
	expect(htmlSelfClosingTagsToXHtml('<img src="url" >')).toBe('<img src="url" />');
});

test('transformMatches', () => {
	expect(transformMatches('some TEXT here', /text/gi, item => `TRANSFORMED ${item}`).join('|')).toStrictEqual(
		'some |TRANSFORMED TEXT| here',
	);

	expect(
		transformMatches(
			'some https://regexr.com/7jk80 here',
			/((?<=^|\s)(https?:\/\/)\S{3,1024})(?=$|\s)/gi,
			item => `URL[${item}]`,
		).join('|'),
	).toStrictEqual('some |URL[https://regexr.com/7jk80]| here');

	expect(
		transformMatches('yoyoyo #gm yeah #whazzup', /#\w{2,32}\b/gi, item => `[${item.slice(1)}]`).join('|'),
	).toStrictEqual('yoyoyo |[gm]| yeah |[whazzup]');
});

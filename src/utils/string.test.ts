import { htmlSelfClosingTagsToXHtml, transformMatches, truncate, truncateAddress, TruncatePoint } from './string';

test('truncate', () => {
	expect(truncate('1234567890', { maxLength: 10 })).toBe('1234567890');
	expect(truncate('1234567890', { maxLength: 5 })).toBe('12390');
	expect(truncate('1234567890', { maxLength: 2 })).toBe('10');
	expect(truncate('1234567890', { maxLength: 1 })).toBe('1');
	expect(truncate('1234567890', { maxLength: 0 })).toBe('1');

	expect(truncate('1234567890', { maxLength: 10, separator: '..' })).toBe('1234567890');
	expect(truncate('1234567890', { maxLength: 5, separator: '..' })).toBe('123..90');
	expect(truncate('1234567890', { maxLength: 2, separator: '..' })).toBe('1..0');
	expect(truncate('1234567890', { maxLength: 1, separator: '..' })).toBe('1..0');
	expect(truncate('1234567890', { maxLength: 0, separator: '..' })).toBe('1..0');

	expect(truncate('1234567890', { maxLength: 10, point: TruncatePoint.END })).toBe('1234567890');
	expect(truncate('1234567890', { maxLength: 5, point: TruncatePoint.END })).toBe('12345');
	expect(truncate('1234567890', { maxLength: 2, point: TruncatePoint.END })).toBe('12');
	expect(truncate('1234567890', { maxLength: 1, point: TruncatePoint.END })).toBe('1');
	expect(truncate('1234567890', { maxLength: 0, point: TruncatePoint.END })).toBe('1');

	expect(truncate('1234567890', { maxLength: 10, point: TruncatePoint.END, separator: '..' })).toBe('1234567890');
	expect(truncate('1234567890', { maxLength: 5, point: TruncatePoint.END, separator: '..' })).toBe('12345..');
	expect(truncate('1234567890', { maxLength: 2, point: TruncatePoint.END, separator: '..' })).toBe('12..');
	expect(truncate('1234567890', { maxLength: 1, point: TruncatePoint.END, separator: '..' })).toBe('1..');
	expect(truncate('1234567890', { maxLength: 0, point: TruncatePoint.END, separator: '..' })).toBe('1..');

	expect(truncate('1234567890', { maxLength: 10, point: TruncatePoint.START })).toBe('1234567890');
	expect(truncate('1234567890', { maxLength: 5, point: TruncatePoint.START })).toBe('67890');
	expect(truncate('1234567890', { maxLength: 2, point: TruncatePoint.START })).toBe('90');
	expect(truncate('1234567890', { maxLength: 1, point: TruncatePoint.START })).toBe('0');
	expect(truncate('1234567890', { maxLength: 0, point: TruncatePoint.START })).toBe('0');

	expect(truncate('1234567890', { maxLength: 10, point: TruncatePoint.START, separator: '..' })).toBe('1234567890');
	expect(truncate('1234567890', { maxLength: 5, point: TruncatePoint.START, separator: '..' })).toBe('..67890');
	expect(truncate('1234567890', { maxLength: 2, point: TruncatePoint.START, separator: '..' })).toBe('..90');
	expect(truncate('1234567890', { maxLength: 1, point: TruncatePoint.START, separator: '..' })).toBe('..0');
	expect(truncate('1234567890', { maxLength: 0, point: TruncatePoint.START, separator: '..' })).toBe('..0');
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

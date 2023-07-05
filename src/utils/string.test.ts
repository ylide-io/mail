import { htmlSelfClosingTagsToXHtml, truncateInMiddle } from './string';

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

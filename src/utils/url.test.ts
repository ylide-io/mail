import { beautifyUrl } from './url';

test('beautifyUrl', () => {
	expect(beautifyUrl('https://localhost:3000/')).toBe('localhost');
	expect(beautifyUrl('https://localhost:3000/project/')).toBe('localhost/project');
	expect(beautifyUrl('https://localhost:3000/?param')).toBe('localhost/?param');
	expect(beautifyUrl('https://localhost:3000/#hash')).toBe('localhost/#hash');
	expect(beautifyUrl('https://www.google.com')).toBe('google.com');
});

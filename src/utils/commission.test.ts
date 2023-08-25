import { calcCommission } from './commission';

test('calcCommission', () => {
	expect(calcCommission('chain2', [])).toBe('0');
	expect(calcCommission('chain2', [{ chain1: '1' }, { chain2: '2' }, { chain3: '3' }])).toBe('2');
	expect(calcCommission('chain2', [{ chain2: '0' }, { chain2: '2' }, { chain2: '1' }])).toBe('3');
	expect(
		calcCommission('chain2', [{ chain2: '3.3333333333333335' }, { chain2: '3.3333333333333335' }, { chain2: '1' }]),
	).toBe('7.666666666666667');
});

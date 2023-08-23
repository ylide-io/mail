export const calcComissions = (blockchain: string, comissions: Record<string, string>[]): string => {
	if (!comissions.length) return '0';

	const blockchainComissions = comissions.map(c => +c[blockchain] || 0);
	const comission = blockchainComissions.reduce((acc, curr) => acc + curr);
	return String(comission);
};

const stripLeadingZeros = (str: string): string => {
	if (str.includes('.')) {
		const [integer, fraction] = str.split('.');
		return `${stripLeadingZeros(integer)}.${fraction}`;
	} else {
		while (str.startsWith('0')) {
			str = str.slice(1);
		}
		return str ? str : '0';
	}
};

export const calcComissionDecimals = (comission: string, decimals: number): string => {
	if (comission.includes('.')) {
		const [integer, fraction] = comission.split('.');
		if (fraction.length > decimals) {
			return stripLeadingZeros(`${integer}${fraction.slice(0, decimals)}.${fraction.slice(decimals)}`);
		} else {
			return stripLeadingZeros(`${integer}${fraction}${'0'.repeat(decimals - fraction.length)}`);
		}
	} else {
		if (comission === '0') {
			return '0';
		} else {
			return stripLeadingZeros(`${comission}${'0'.repeat(decimals)}`);
		}
	}
};

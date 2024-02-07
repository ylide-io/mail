import { formatMoney } from './money';

export const formatUsdExt = (value: number, decimals = 1) => {
	if (value < 1 / (decimals + 1)) {
		if (value === 0) {
			return '$0';
		}
		const sv = String(value);
		if (sv.includes('e')) {
			return '< $0.0000001';
		} else {
			const [v1, v2] = String(value).split('.');
			let lz = 0;
			while (v2[lz] === '0') lz++;
			return `$${v1}.${v2.slice(0, lz + 1)}`;
		}
	} else {
		return formatMoney(value);
	}
};

export const formatNumberExt = (value: number, decimals = 1) => {
	if (value < 1 / (decimals + 1)) {
		if (value === 0) {
			return '0';
		}
		const sv = String(value);
		if (sv.includes('e')) {
			return '< 0.0000001';
		} else {
			const [v1, v2] = String(value).split('.');
			let lz = 0;
			while (v2[lz] === '0') lz++;
			return `${v1}.${v2.slice(0, lz + 1)}`;
		}
	} else {
		return String(Number(value.toFixed(decimals)));
	}
};

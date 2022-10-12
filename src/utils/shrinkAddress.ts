export const shrinkAddress = (address: string, maxLength: number) => {
	if (address.length <= maxLength) {
		return address;
	} else {
		const trimSize = Math.round((maxLength - 3) / 2);
		return address.substring(0, trimSize) + '...' + address.substring(address.length - trimSize, address.length);
	}
};

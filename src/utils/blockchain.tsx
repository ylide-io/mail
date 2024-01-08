export function formatAddress(address: string) {
	return (
		address
			.toLowerCase()
			// 000000000000000000000000d3c2b7b1ebcd6949abcf1041cc629b2648ad2329 -> 0xd3c2b7b1ebcd6949abcf1041cc629b2648ad2329
			.replace(/^0{24}/, '0x')
			// 3f4dcce76d4760fb23879fee1a28f278b0739f99c13911094418c042fb7fbc45 -> 0:3f4dcce76d4760fb23879fee1a28f278b0739f99c13911094418c042fb7fbc45
			.replace(/^([a-f0-9]{64})$/i, '0:$1')
	);
}

export function addressesEqual(a: string, b: string) {
	return formatAddress(a) === formatAddress(b);
}

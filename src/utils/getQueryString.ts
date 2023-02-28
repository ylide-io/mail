export function getQueryString() {
	const query = window.location.search.substring(1);
	return query
		.split('&')
		.map(q => q.split('='))
		.reduce(
			(p, c) => ({
				...p,
				[decodeURIComponent(c[0])]: decodeURIComponent(c[1]),
			}),
			{} as Record<string, string>,
		);
}

import domain from '../stores/Domain';

export function isAddress(input: string): boolean {
	return domain.getBlockchainsForAddress(input.toLowerCase()).length > 0;
}

export function isEns(input: string): boolean {
	return input.toLowerCase().endsWith('.eth');
}

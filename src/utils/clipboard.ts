import { toast } from '../components/toast/toast';

export async function copyToClipboard(text: string, params?: { toast?: boolean | string }) {
	await navigator.clipboard.writeText(text);

	if (params?.toast) {
		toast(typeof params.toast === 'string' ? params.toast : 'Copied to clipboard 🔥');
	}
}

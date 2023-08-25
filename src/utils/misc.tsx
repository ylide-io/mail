import { analytics } from '../stores/Analytics';

export function openInNewWidnow(url: string) {
	window.open(url, '_blank')?.focus();
}

export function openCreateCommunityForm(place: string) {
	analytics.openCreateCommunityForm(place);
	openInNewWidnow('https://forms.gle/p9141gy5wn7DCjZA8');
}

import { analytics } from '../stores/Analytics';

export function openCreateCommunityForm() {
	analytics.openCreateCommunityForm();
	window.open('https://forms.gle/p9141gy5wn7DCjZA8', '_blank')?.focus();
}

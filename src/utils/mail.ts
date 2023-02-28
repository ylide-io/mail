export function formatSubject(subject?: string | null, prefix?: string) {
	return `${prefix || ''}${subject || '(no subject)'}`;
}

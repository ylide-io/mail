import { generatePath, useLocation } from 'react-router-dom';

import { useComposeMailPopup } from '../pages/mail/components/composeMailPopup/composeMailPopup';
import { WidgetId } from '../pages/widgets/widgets';
import { browserStorage } from '../stores/browserStorage';
import { globalOutgoingMailData, OutgoingMailData } from '../stores/outgoingMailData';
import { RoutePath } from '../stores/routePath';
import { useNav } from './url';

export function formatSubject(subject?: string | null, prefix?: string) {
	return `${prefix || ''}${subject || '(no subject)'}`;
}

export function useOpenMailCopmpose() {
	const location = useLocation();
	const navigate = useNav();
	const composeMailPopup = useComposeMailPopup();

	return ({ mailData }: { mailData?: OutgoingMailData } = {}) => {
		if (location.pathname !== generatePath(RoutePath.MAIL_COMPOSE)) {
			if (browserStorage.widgetId === WidgetId.INBOX) {
				globalOutgoingMailData.reset(mailData);
				navigate(generatePath(RoutePath.MAIL_COMPOSE));
			} else {
				composeMailPopup({ mailData: mailData || new OutgoingMailData() }).then();
			}
		}
	};
}

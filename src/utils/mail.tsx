import { generatePath, useLocation } from 'react-router-dom';

import { showStaticComponent } from '../components/staticComponentManager/staticComponentManager';
import {
	COMPOSE_MAIL_POPUP_SINGLETON_KEY,
	ComposeMailPopup,
} from '../pages/mail/components/composeMailPopup/composeMailPopup';
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

	return ({ mailData }: { mailData?: OutgoingMailData } = {}) => {
		if (location.pathname !== generatePath(RoutePath.MAIL_COMPOSE)) {
			if (browserStorage.widgetId === WidgetId.MAILBOX) {
				globalOutgoingMailData.reset(mailData);
				navigate(generatePath(RoutePath.MAIL_COMPOSE));
			} else {
				showStaticComponent(
					resolve => <ComposeMailPopup mailData={mailData || new OutgoingMailData()} onClose={resolve} />,
					{ singletonKey: COMPOSE_MAIL_POPUP_SINGLETON_KEY },
				);
			}
		}
	};
}

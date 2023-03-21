import { useEffect } from 'react';
import { generatePath } from 'react-router-dom';

import { browserStorage } from '../../../stores/browserStorage';
import { FolderId } from '../../../stores/MailList';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import { WidgetId } from '../widgets';

export function MailboxWidget() {
	const navigate = useNav();

	useEffect(() => {
		browserStorage.widgetId = WidgetId.MAILBOX;
		navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: FolderId.Inbox }), { replace: true });
	}, [navigate]);

	return <></>;
}

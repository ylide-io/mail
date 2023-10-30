import { reaction } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useRef } from 'react';

import { generateMailDetailsPageUrl } from '../../pages/mail/mailDetailsPage/mailDetailsPage';
import { FolderId } from '../../stores/MailList';
import { newMailChecker } from '../../stores/newMailChecker';
import { useNav } from '../../utils/url';
import { inAppNotification } from '../inAppNotification/inAppNotification';
import css from './newMailNotifier.module.scss';

export const NewMailNotifier = observer(() => {
	const navigate = useNav();

	// Hotfix for not-working MailList.onNewMessages callback
	const lastMessageId = useRef('');

	useEffect(() =>
		reaction(
			() => newMailChecker.newMessage,
			newMessage => {
				if (newMessage && newMessage.id !== lastMessageId.current) {
					lastMessageId.current = newMessage.id;

					inAppNotification(
						<>
							You have a new message 🔥
							<div className={css.subtext}>Click to open</div>
						</>,
						{
							onClick: () => navigate(generateMailDetailsPageUrl(FolderId.Inbox, newMessage.id)),
						},
					);
				}
			},
		),
	);

	return <></>;
});

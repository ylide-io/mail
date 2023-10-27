import { reaction } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useRef } from 'react';
import { generatePath } from 'react-router-dom';

import { FolderId } from '../../stores/MailList';
import { newMailChecker } from '../../stores/newMailChecker';
import { RoutePath } from '../../stores/routePath';
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
							onClick: () =>
								navigate(
									generatePath(RoutePath.MAIL_FOLDER_DETAILS, {
										folderId: FolderId.Inbox,
										id: encodeURIComponent(newMessage.id),
									}),
								),
						},
					);
				}
			},
		),
	);

	return <></>;
});

import { observer } from 'mobx-react';
import mailList from '../../../stores/MailList';

const MailsCounter = observer(() => {
	// useEffect(() => {
	// 	tags.getTags();
	// }, []);

	// const calculateFolderLength = (): string => {
	// 	const length: number = mailer.inboxMessages.length;
	// 	return length + `${domain.inbox.isNextPageAvailable ? '+' : ''}`;
	// };

	// const { folderName, folderLength } = (() => {
	// 	const folderLength = calculateFolderLength();

	// 	if (mailer.activeFolderId) {
	// 		return {
	// 			folderName: tags.tags.find(elem => elem.id === mailer.activeFolderId)?.name || '',
	// 			folderLength: folderLength,
	// 		};
	// 	} else {
	// 		return {
	// 			folderName: mailer.filteringMethod === 'archived' ? 'Archive' : 'Inbox',
	// 			folderLength: folderLength,
	// 		};
	// 	}
	// })();

	const folderName = 'Temp';
	const folderLength = mailList.messages.length;

	return (
		<h2>
			{folderName} ({folderLength})
		</h2>
	);
});

export default MailsCounter;

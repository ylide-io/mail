import React from 'react';
import SmallButton, { smallButtonColors, smallButtonIcons } from '../../../components/smallButton/smallButton';
import { observer } from 'mobx-react';
import mailer from '../../../stores/Mailer';
import domain from '../../../stores/Domain';

const MailsListTooltips = observer(() => {
	// const readHandler = () => {
	// 	mailer.readCheckedMessage();
	// };

	// const deleteHandler = () => {
	// 	mailer.deleteCheckedMessages();
	// };

	const pageNextHandler = async () => {
		if (mailer.pageSwitchLoading) return;
		// await mailer.goNextPage();
	};

	const pagePrevHandler = async () => {
		if (mailer.pageSwitchLoading) return;
		// await mailer.goPrevPage();
	};

	// const pagesCount =
	// 	Math.floor(mailer.messageIds.length / mailer.messagesOnPage) +
	// 	(mailer.messageIds.length % mailer.messagesOnPage ? 1 : 0);
	// const isNextPageAvailable = domain.inbox.isNextPageAvailable;

	return (
		<div className="mail-tools tooltip-demo m-t-md">
			{/* <div className="btn-group float-right">
				<SmallButton
					disabled={mailer.page === 1 || mailer.pageSwitchLoading}
					onClick={pagePrevHandler}
					color={smallButtonColors.white}
					icon={smallButtonIcons.arrowLeft}
				/>
				<SmallButton
					disabled={!isNextPageAvailable || mailer.pageSwitchLoading}
					onClick={pageNextHandler}
					color={smallButtonColors.white}
					icon={smallButtonIcons.forward}
				/>
			</div>
			<div className="tooltip-buttons-space">
				<SmallButton
					onClick={readHandler}
					color={smallButtonColors.white}
					icon={smallButtonIcons.eye}
					title={'Mark as read'}
				/>
				<SmallButton
					onClick={deleteHandler}
					color={smallButtonColors.white}
					icon={smallButtonIcons.trash}
					title={'Archive mails'}
				/>
			</div> */}
		</div>
	);
});

export default MailsListTooltips;

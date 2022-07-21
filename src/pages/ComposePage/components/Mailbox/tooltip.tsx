import React from 'react';
import SmallButton, { smallButtonColors, smallButtonIcons } from '../../../../components/smallButton/smallButton';
import mailer from '../../../../stores/Mailer';
import { observer } from 'mobx-react';
import mailbox from '../../../../stores/Mailbox';
import { useNav } from '../../../../utils/navigate';
import domain from '../../../../stores/Domain';

const Tooltip = observer(() => {
	const navigate = useNav();

	const sendMailHandler = async (e: Event) => {
		try {
			e.preventDefault();

			if (!mailbox.textEditorData?.blocks?.length || !mailbox.recipients.length) return;

			//Filter duplicates addresses
			const recipients = mailbox.recipients.filter((value, index, array) => array.indexOf(value) === index);

			const pRecipients = await mailer.prepareRecipients(domain.everscaleKey, recipients);

			const mailsPromise = await mailer.sendMail(
				domain.everscaleKey,
				mailbox.subject,
				JSON.stringify(mailbox.textEditorData),
				pRecipients,
			);

			alert('Successfully sent');

			navigate('/mailbox');
		} catch (e) {
			console.log('Error sending message', e);
		}
	};

	return (
		<div className="mail-body text-right tooltip-demo tooltip-buttons-space">
			<SmallButton
				onClick={sendMailHandler}
				text={mailer.sending ? 'Sending...' : 'Send'}
				color={smallButtonColors.green}
				title={'Send'}
				icon={smallButtonIcons.reply}
				additionalClass={{
					disabled: mailer.sending,
				}}
			/>

			<SmallButton
				onClick={() => {
					navigate('/mailbox');
				}}
				text={'Discard'}
				color={smallButtonColors.white}
				title={'Discard email'}
				icon={smallButtonIcons.cross}
			/>

			{/* <SmallButton
                onClick={() => {
                    navigate("/mailbox");
                }}
                text={"Draft"}
                color={smallButtonColors.white}
                title={"Move to draft folder"}
                icon={smallButtonIcons.pencil}
            /> */}
		</div>
	);
});

export default Tooltip;

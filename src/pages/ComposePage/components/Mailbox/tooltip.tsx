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

			mailer.sending = true;

			//Filter duplicates addresses
			const recipients = mailbox.recipients.filter((value, index, array) => array.indexOf(value) === index);
			const recipientKeys = await Promise.all(
				recipients.map(async r => {
					const blockchains = domain.getBlockchainsForAddress(r);
					const keys = await Promise.all(
						blockchains.map(async bc => {
							try {
								return await bc.reader.extractPublicKeyFromAddress(r);
							} catch (err) {
								return null;
							}
						}),
					);
					return keys.some(k => !!k);
				}),
			);

			const recs = recipients.filter((e, i) => recipientKeys[i]);

			if (!recs.length) {
				alert('For your recipients we found no keys on the blockchain');
				mailer.sending = false;
				return;
			}

			const msgId = await mailer.sendMail(
				domain.accounts.accounts[0],
				mailbox.subject,
				JSON.stringify(mailbox.textEditorData),
				recs,
			);

			alert(`Successfully sent, msgId: ${msgId}`);

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

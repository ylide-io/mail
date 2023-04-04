import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ActionButton, ActionButtonLook } from '../../../components/ActionButton/ActionButton';
import { Recipients } from '../../../components/recipientInput/recipientInput';
import { Toast } from '../../../components/toast/toast';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { OutgoingMailData } from '../../../stores/outgoingMailData';
import { invariant } from '../../../utils/assert';
import { ComposeMailForm } from '../../mail/components/composeMailForm/composeMailForm';
import { postWidgetMessage, WidgetEvent, WidgetId } from '../widgets';
import css from './sendMessageWidget.module.scss';

export function SendMessageWidget() {
	const [searchParams] = useSearchParams();
	const toAddress = searchParams.get('to');
	const subject = searchParams.get('subject') || '';
	invariant(toAddress, 'to-address required');

	const mailData = useMemo(() => {
		const data = new OutgoingMailData();
		data.to = new Recipients(toAddress ? [toAddress] : undefined);
		data.subject = subject;
		return data;
	}, [subject, toAddress]);

	const postCloseMessage = () => {
		postWidgetMessage(WidgetId.SEND_MESSAGE, WidgetEvent.CLOSE);
	};

	return (
		<div className={css.root}>
			<div className={css.header}>
				New message
				<div className={css.headerActions}>
					<ActionButton
						look={ActionButtonLook.LITE}
						icon={<CrossSvg />}
						title="Close"
						onClick={postCloseMessage}
					/>
				</div>
			</div>

			<ComposeMailForm
				className={css.form}
				isRecipientInputDisabled
				mailData={mailData}
				onSent={() =>
					setTimeout(() => {
						postCloseMessage();
					}, Toast.DISPLAY_TIME)
				}
			/>
		</div>
	);
}

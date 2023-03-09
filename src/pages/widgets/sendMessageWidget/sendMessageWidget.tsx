import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ActionButton, ActionButtonLook } from '../../../components/ActionButton/ActionButton';
import { Recipients } from '../../../components/recipientInput/recipientInput';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { OutgoingMailData } from '../../../stores/outgoingMailData';
import { invariant } from '../../../utils/invariant';
import { ComposeMailForm } from '../../mail/components/composeMailForm/composeMailForm';
import css from './sendMessageWidget.module.scss';

export function SendMessageWidget() {
	const [searchParams] = useSearchParams();
	const toAddress = searchParams.get('to');
	invariant(toAddress, 'to-address required');

	const mailData = useMemo(() => {
		const data = new OutgoingMailData();
		data.to = new Recipients([toAddress]);
		return data;
	}, [toAddress]);

	return (
		<div className={css.root}>
			<div className={css.header}>
				New message
				<div className={css.headerActions}>
					<ActionButton look={ActionButtonLook.LITE} icon={<CrossSvg />} title="Close" />
				</div>
			</div>

			<ComposeMailForm className={css.form} mailData={mailData} />
		</div>
	);
}

import clsx from 'clsx';
import { observer } from 'mobx-react';
import React from 'react';

import { MailboxEditor } from '../../pages/ComposePage/mailboxEditor/mailboxEditor';
import { OutgoingMailData } from '../../stores/outgoingMailData';
import { formatSubject } from '../../utils/mail';
import { AccountSelect } from '../accountSelect/accountSelect';
import { PropsWithClassName } from '../propsWithClassName';
import { RecipientInput } from '../recipientInput/recipientInput';
import { TextField } from '../textField/textField';
import css from './composeMailForm.module.scss';
import { SendMailButton } from './sendMailButton/sendMailButton';

export interface ComposeMailFormProps extends PropsWithClassName {
	mailData: OutgoingMailData;
	onSent?: () => void;
}

export const ComposeMailForm = observer(({ className, mailData, onSent }: ComposeMailFormProps) => {
	return (
		<div className={clsx(css.root, className)}>
			<div className={css.meta}>
				<div className={css.metaLabel}>From</div>
				<AccountSelect activeAccount={mailData.from} onChange={account => (mailData.from = account)} />

				<div className={css.metaLabel}>To</div>
				<RecipientInput value={mailData.to} />

				<div className={css.metaLabel}>Subject</div>
				<TextField
					placeholder={formatSubject()}
					value={mailData.subject}
					onValueChange={value => (mailData.subject = value)}
				/>
			</div>

			<div className={css.content}>
				<MailboxEditor mailData={mailData} />
			</div>

			<div className={css.footer}>
				<SendMailButton mailData={mailData} onSent={onSent} />
			</div>
		</div>
	);
});

import clsx from 'clsx';
import { observer } from 'mobx-react';
import React from 'react';

import { AccountSelect } from '../../../../components/accountSelect/accountSelect';
import { PropsWithClassName } from '../../../../components/propsWithClassName';
import { RecipientInput } from '../../../../components/recipientInput/recipientInput';
import { TextField } from '../../../../components/textField/textField';
import domain from '../../../../stores/Domain';
import { OutgoingMailData } from '../../../../stores/outgoingMailData';
import { formatSubject } from '../../../../utils/mail';
import { MailboxEditor } from '../../composePage/mailboxEditor/mailboxEditor';
import css from './composeMailForm.module.scss';
import { SendMailButton } from './sendMailButton/sendMailButton';

export interface ComposeMailFormProps extends PropsWithClassName {
	isRecipientInputDisabled?: boolean;
	mailData: OutgoingMailData;
	onSent?: () => void;
}

export const ComposeMailForm = observer(
	({ className, isRecipientInputDisabled, mailData, onSent }: ComposeMailFormProps) => {
		return (
			<div className={clsx(css.root, className)}>
				<div className={css.meta}>
					{domain.accounts.hasActiveAccounts && (
						<>
							<div className={css.metaLabel}>From</div>
							<AccountSelect
								activeAccount={mailData.from}
								onChange={account => (mailData.from = account)}
							/>
						</>
					)}

					<div className={css.metaLabel}>To</div>
					<RecipientInput isReadOnly={isRecipientInputDisabled} value={mailData.to} />

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
	},
);

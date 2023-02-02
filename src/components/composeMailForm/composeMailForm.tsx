import clsx from 'clsx';
import React, { useState } from 'react';

import { globalOutgoingMailData } from '../../stores/outgoingMailData';
import { formatSubject } from '../../utils/mail';
import { AccountSelect } from '../accountSelect/accountSelect';
import { PropsWithClassName } from '../propsWithClassName';
import { RecipientInput, RecipientInputItem } from '../recipientInput/recipientInput';
import { TextField } from '../textField/textField';
import css from './composeMailForm.module.scss';

export interface ComposeMailFormProps extends PropsWithClassName {}

export function ComposeMailForm({ className }: ComposeMailFormProps) {
	const [recipients, setRecipients] = useState<RecipientInputItem[]>([]);

	return (
		<div className={clsx(css.root, className)}>
			<div className={css.meta}>
				<div className={css.metaLabel}>From</div>
				<AccountSelect
					activeAccount={globalOutgoingMailData.from}
					onChange={account => (globalOutgoingMailData.from = account)}
				/>

				<div className={css.metaLabel}>To</div>
				<RecipientInput initialValue={globalOutgoingMailData.to} onChange={setRecipients} />

				<div className={css.metaLabel}>Subject</div>
				<TextField
					placeholder={formatSubject()}
					value={globalOutgoingMailData.subject}
					onChange={value => (globalOutgoingMailData.subject = value)}
				/>
			</div>

			<div className={css.content} />

			<div className={css.footer}>FOOTER</div>
		</div>
	);
}

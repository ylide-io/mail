import clsx from 'clsx';
import { observer } from 'mobx-react';
import React from 'react';

import { OutgoingMailData } from '../../stores/outgoingMailData';
import { formatSubject } from '../../utils/mail';
import { AccountSelect } from '../accountSelect/accountSelect';
import { PropsWithClassName } from '../propsWithClassName';
import { RecipientInput } from '../recipientInput/recipientInput';
import { TextField } from '../textField/textField';
import css from './composeMailForm.module.scss';

export interface ComposeMailFormProps extends PropsWithClassName {
	mailData: OutgoingMailData;
}

export const ComposeMailForm = observer(({ className, mailData }: ComposeMailFormProps) => {
	return (
		<div className={clsx(css.root, className)}>
			<div className={css.meta}>
				<div className={css.metaLabel}>From</div>
				<AccountSelect activeAccount={mailData.from} onChange={account => (mailData.from = account)} />

				<div className={css.metaLabel}>To</div>
				<RecipientInput
					initialValue={mailData.to}
					onChange={value => (mailData.to = value.map(it => it.routing?.address).filter(Boolean) as string[])}
				/>

				<div className={css.metaLabel}>Subject</div>
				<TextField
					placeholder={formatSubject()}
					value={mailData.subject}
					onChange={value => (mailData.subject = value)}
				/>
			</div>

			<div className={css.content} />

			<div className={css.footer}>FOOTER</div>
		</div>
	);
});

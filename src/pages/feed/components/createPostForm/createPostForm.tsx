import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { VenomFilterApi } from '../../../../api/venomFilterApi';
import { AccountSelect } from '../../../../components/accountSelect/accountSelect';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { AutoSizeTextArea } from '../../../../components/autoSizeTextArea/autoSizeTextArea';
import { PropsWithClassName } from '../../../../components/props';
import { toast } from '../../../../components/toast/toast';
import { VENOM_FEED_ID } from '../../../../constants';
import { ReactComponent as BulbSvg } from '../../../../icons/ic28/bulb.svg';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { OutgoingMailData, OutgoingMailDataMode } from '../../../../stores/outgoingMailData';
import { SendMailButton } from '../../../mail/components/composeMailForm/sendMailButton/sendMailButton';
import css from './createPostForm.module.scss';

export interface CreatePostFormProps extends PropsWithClassName {
	accounts: DomainAccount[];
	onCreated?: () => void;
}

export const CreatePostForm = observer(({ className, accounts, onCreated }: CreatePostFormProps) => {
	const mailData = useMemo(() => {
		const mailData = new OutgoingMailData();

		mailData.mode = OutgoingMailDataMode.BROADCAST;
		mailData.feedId = VENOM_FEED_ID;

		mailData.validator = () => {
			if (mailData.plainTextData.length > 4096) {
				toast('Text is too long 👀');
				return false;
			}

			if (mailData.plainTextData.split('\n').length > 128) {
				toast('Too many line breaks 👀');
				return false;
			}

			return true;
		};

		return mailData;
	}, []);

	useEffect(() => {
		mailData.from = mailData.from && accounts.includes(mailData.from) ? mailData.from : accounts[0];
	}, [mailData, accounts]);

	const [expanded, setExpanded] = useState(false);

	const { mutate: loadIdea, isLoading: isIdeaLoading } = useMutation({
		mutationFn: () => VenomFilterApi.getTextIdea(),
		onSuccess: data => {
			mailData.plainTextData = [mailData.plainTextData, data].filter(Boolean).join('\n\n');
		},
		onError: () => toast('Failed to get idea 🤦‍♀️'),
	});

	const onSent = () => {
		mailData.reset({
			mode: OutgoingMailDataMode.BROADCAST,
			feedId: VENOM_FEED_ID,
			from: mailData.from,
		});

		setExpanded(false);

		onCreated?.();
	};

	return (
		<div className={clsx(css.form, expanded && css.form_expanded, className)}>
			<AutoSizeTextArea
				resetKey={expanded}
				className={css.textarea}
				disabled={mailData.sending}
				placeholder="Make a new post"
				maxHeight={400}
				rows={expanded ? 4 : 1}
				value={mailData.plainTextData}
				onChangeValue={value => {
					mailData.plainTextData = value;
				}}
				onFocus={() => setExpanded(true)}
			/>

			{expanded ? (
				<>
					<div className={css.divider} />

					<div className={css.footer}>
						<AccountSelect
							className={css.accontSelect}
							accounts={accounts}
							activeAccount={mailData.from}
							onChange={account => (mailData.from = account)}
						/>

						<div className={css.footerRight}>
							<ActionButton
								isDisabled={mailData.sending || isIdeaLoading}
								size={ActionButtonSize.MEDIUM}
								look={ActionButtonLook.LITE}
								icon={<BulbSvg />}
								title="Get idea!"
								onClick={() => loadIdea()}
							/>

							<SendMailButton disabled={isIdeaLoading} mailData={mailData} onSent={onSent} />
						</div>
					</div>
				</>
			) : (
				<ActionButton isDisabled size={ActionButtonSize.MEDIUM} look={ActionButtonLook.SECONDARY}>
					Post
				</ActionButton>
			)}
		</div>
	);
});

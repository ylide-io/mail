import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';

import { OtcApi } from '../../../api/otcApi';
import { AccountSelect } from '../../../components/accountSelect/accountSelect';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButtonX/ActionButton';
import { AdaptiveAddress } from '../../../components/adaptiveAddress/adaptiveAddress';
import { AutoSizeTextArea } from '../../../components/autoSizeTextArea/autoSizeTextArea';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { TextProcessor } from '../../../components/textProcessor/textProcessor';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { REACT_APP__OTC_PROVIDER } from '../../../env';
import { ReactComponent as ContactSvg } from '../../../icons/ic20/contact.svg';
import { IMessageDecodedContent } from '../../../indexedDB/IndexedDB';
import domain from '../../../stores/Domain';
import { OutgoingMailData, Recipients } from '../../../stores/outgoingMailData';
import { invariant } from '../../../utils/assert';
import { decodeMessage, parseEditorJsJson } from '../../../utils/mail';
import { SendMailButton } from '../../mail/_common/composeMailForm/sendMailButton/sendMailButton';
import { OtcLayout } from '../_common/otcLayout/otcLayout';
import { getOtcProviderLogo } from '../otc';
import { IframePopup } from './iframePopup/iframePopup';
import css from './OtcChatPage.module.scss';

interface ChatData extends OtcApi.IThreadResponse {
	decodedMessagesById: Record<string, IMessageDecodedContent>;
}

interface ChatProps {
	data: ChatData;
}

export function Chat({ data }: ChatProps) {
	return (
		<div className={css.chat}>
			{data.entries.map(entry => {
				invariant(entry.type === 'message');

				const decoded = data.decodedMessagesById[entry.id] || undefined;

				return (
					<div
						key={entry.id}
						className={clsx(css.message, entry.isIncoming ? css.message_in : css.message_out)}
					>
						<TextProcessor
							text={
								decoded?.decodedTextData ? parseEditorJsJson(decoded?.decodedTextData) : '[Encrypted]'
							}
						/>
					</div>
				);
			})}
		</div>
	);
}

export const OtcChatPage = observer(() => {
	const { address } = useParams<{ address: string }>();
	invariant(address);

	const [myAccount, setMyAccount] = useState(domain.accounts.activeAccounts[0]);

	const { isError, data, refetch } = useQuery(
		['otc', 'chat', myAccount.account.address, address],
		async () => {
			const thread = await OtcApi.loadOtcThread({
				myAddress: myAccount.account.address,
				recipientAddress: address,
			});

			const decodedMessages = await Promise.all(
				thread.entries
					.filter(entry => entry.type === 'message')
					.map(entry => {
						invariant(entry.type === 'message');
						return decodeMessage(entry.id, entry.msg, myAccount.account);
					}),
			);

			return {
				...thread,
				decodedMessagesById: decodedMessages.reduce(
					(p, c) => ({
						...p,
						[c.msgId]: c,
					}),
					{},
				),
			} as ChatData;
		},
		{
			refetchInterval: 5000,
		},
	);

	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (contentRef.current) {
			contentRef.current.scrollTop = Number.MAX_SAFE_INTEGER;
		}
	}, [data]);

	const [newMessage, setNewMessage] = useState('');

	const mailData = useMemo(() => new OutgoingMailData(), []);
	useEffect(() => {
		if (mailData.from !== myAccount) {
			mailData.from = myAccount;
		}

		if (!mailData.to.items.length || mailData.to.items[0].routing?.address !== address) {
			mailData.to = new Recipients([address]);
		}

		mailData.plainTextData = newMessage;
	}, [address, mailData, mailData.from, myAccount, newMessage]);

	const [isIframeOpen, setIframeOpen] = useState(false);
	const [isIframeMinimized, setIframeMinimized] = useState(false);

	const ProviderLogo = getOtcProviderLogo(REACT_APP__OTC_PROVIDER);

	function onSent() {
		setNewMessage('');
		refetch();
	}

	return (
		<OtcLayout
			title={
				<div className={css.title}>
					<ContactSvg width={32} height={32} />
					Chat with <AdaptiveAddress address={address} />
				</div>
			}
			isAsideCentered
			aside={
				<div>
					<ActionButton
						className={clsx(css.tradeButton, isIframeMinimized && css.tradeButton_active)}
						size={ActionButtonSize.XLARGE}
						look={isIframeMinimized ? ActionButtonLook.SECONDARY : ActionButtonLook.PRIMARY}
						onClick={() => {
							setIframeOpen(true);
							setIframeMinimized(false);
						}}
					>
						{isIframeMinimized ? 'Continue ...' : 'Start a Trade'}
					</ActionButton>

					<div className={css.provider}>
						<div className={css.providerTitle}>Powered by:</div>

						<ProviderLogo className={css.providerLogo} />
					</div>
				</div>
			}
			contentClass={css.body}
		>
			{domain.accounts.activeAccounts.length > 1 && (
				<div className={css.header}>
					Your account
					<AccountSelect activeAccount={myAccount} onChange={setMyAccount} />
				</div>
			)}

			<div ref={contentRef} className={css.content}>
				{data ? (
					data.entries.length ? (
						<Chat data={data} />
					) : (
						<div className={css.noMessages}>No messages yet ...</div>
					)
				) : isError ? (
					<ErrorMessage>Couldn't load messages</ErrorMessage>
				) : (
					<YlideLoader className={css.loader} reason="Loading messages ..." />
				)}
			</div>

			<div className={css.footer}>
				<AutoSizeTextArea
					className={css.textarea}
					maxHeight={200}
					rows={1}
					placeholder="Type your message here"
					value={newMessage}
					onChangeValue={setNewMessage}
				/>

				<SendMailButton mailData={mailData} onSent={onSent} />
			</div>

			{isIframeOpen && (
				<IframePopup
					isMinimized={isIframeMinimized}
					onMinimize={() => setIframeMinimized(true)}
					onClose={() => setIframeOpen(false)}
				/>
			)}
		</OtcLayout>
	);
});

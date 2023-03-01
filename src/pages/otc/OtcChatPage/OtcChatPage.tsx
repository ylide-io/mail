import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';

import { OtcApi } from '../../../api/otcApi';
import { AccountSelect } from '../../../components/accountSelect/accountSelect';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { SendMailButton } from '../../../components/composeMailForm/sendMailButton/sendMailButton';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { NlToBr } from '../../../components/nlToBr/nlToBr';
import { Recipients } from '../../../components/recipientInput/recipientInput';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { AdaptiveAddress } from '../../../controls/adaptiveAddress/adaptiveAddress';
import { ReactComponent as ContactSvg } from '../../../icons/ic20/contact.svg';
import { IMessageDecodedContent } from '../../../indexedDB/MessagesDB';
import domain from '../../../stores/Domain';
import { decodeMessage } from '../../../stores/MailList';
import { OutgoingMailData } from '../../../stores/outgoingMailData';
import { invariant } from '../../../utils/invariant';
import { parseEditorjsJson } from '../../../utils/parseEditorjsJson';
import { useAutoSizeTextArea } from '../../../utils/useAutoSizeTextArea';
import { OtcLayout } from '../components/otcLayout/otcLayout';
import { ReactComponent as AirSwapSvg } from './airswap.svg';
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
						<NlToBr
							text={
								decoded?.decodedTextData ? parseEditorjsJson(decoded?.decodedTextData) : '[Encrypted]'
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

	const textareaRef = useRef(null);
	const [newMessage, setNewMessage] = useState('');
	useAutoSizeTextArea(textareaRef, newMessage, 200);

	const mailData = useMemo(() => new OutgoingMailData(), []);
	useEffect(() => {
		if (mailData.from !== myAccount) {
			mailData.from = myAccount;
		}

		if (!mailData.to.items.length || mailData.to.items[0].routing?.address !== address) {
			mailData.to = new Recipients([address]);
		}

		mailData.plainTextData = newMessage;
	}, [address, mailData, myAccount, newMessage]);

	const [isIframeOpen, setIframeOpen] = useState(false);
	const [isIframeMinimized, setIframeMinimized] = useState(false);

	function onSent() {
		setNewMessage('');
		refetch().then();
	}

	return (
		<OtcLayout
			isShrinkedToPageSize
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
						size={ActionButtonSize.Large}
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

						<AirSwapSvg className={css.providerLogo} />
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
				<textarea
					ref={textareaRef}
					className={css.textarea}
					rows={1}
					placeholder="Type your message here"
					value={newMessage}
					onChange={e => setNewMessage(e.target.value)}
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

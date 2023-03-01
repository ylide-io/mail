import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';

import { OtcApi } from '../../../api/otcApi';
import { AccountSelect } from '../../../components/accountSelect/accountSelect';
import { SendMailButton } from '../../../components/composeMailForm/sendMailButton/sendMailButton';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { NlToBr } from '../../../components/nlToBr/nlToBr';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { AdaptiveAddress } from '../../../controls/adaptiveAddress/adaptiveAddress';
import { ReactComponent as ContactSvg } from '../../../icons/ic20/contact.svg';
import { IMessageDecodedContent } from '../../../indexedDB/MessagesDB';
import domain from '../../../stores/Domain';
import { decodeMessage } from '../../../stores/MailList';
import { globalOutgoingMailData } from '../../../stores/outgoingMailData';
import { invariant } from '../../../utils/invariant';
import { parseEditorjsJson } from '../../../utils/parseEditorjsJson';
import { useAutoSizeTextArea } from '../../../utils/useAutoSizeTextArea';
import { OtcLayout } from '../components/otcLayout/otcLayout';
import css from './OtcChatPage.module.scss';
import { TradingForm, TradingFormData } from './tradingForm/tradingForm';

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
						<NlToBr text={decoded?.decodedTextData ? parseEditorjsJson(decoded?.decodedTextData) : '[Encrypted]'} />
					</div>
				);
			})}
		</div>
	);
}

export const OtcChatPage = observer(() => {
	const { address } = useParams<{ address: string }>();
	invariant(address);

	const [tradingFormData, setTradingFormData] = useState<TradingFormData>({
		send: {
			amount: '',
			token: 'USDT',
		},
		receive: {
			amount: '',
			token: 'BTC',
		},
	});

	const [myAccount, setMyAccount] = useState(domain.accounts.activeAccounts[0]);

	const { isError, data } = useQuery(['otc', 'chat', myAccount.account.address, address], async () => {
		const thread = await OtcApi.loadOtcThread({ myAddress: myAccount.account.address, recipientAddress: address });

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
	});

	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (contentRef.current) {
			contentRef.current.scrollTop = Number.MAX_SAFE_INTEGER;
		}
	}, [data]);

	const textareaRef = useRef(null);
	const [newMessage, setNewMessage] = useState('');
	useAutoSizeTextArea(textareaRef, newMessage, 200);

	return (
		<OtcLayout
			title={
				<div className={css.title}>
					<ContactSvg width={32} height={32} />
					Chat with <AdaptiveAddress address={address} />
				</div>
			}
			aside={<TradingForm data={tradingFormData} onChange={setTradingFormData} />}
		>
			<div className={css.body}>
				{domain.accounts.activeAccounts.length > 1 && (
					<div className={css.header}>
						Your account
						<AccountSelect activeAccount={myAccount} onChange={setMyAccount} />
					</div>
				)}

				<div ref={contentRef} className={css.content}>
					{data ? (
						<Chat data={data} />
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

					<SendMailButton mailData={globalOutgoingMailData} />
				</div>
			</div>
		</OtcLayout>
	);
});

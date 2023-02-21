import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { SendMailButton } from '../../../components/composeMailForm/sendMailButton/sendMailButton';
import { AdaptiveAddress } from '../../../controls/adaptiveAddress/adaptiveAddress';
import { ReactComponent as ContactSvg } from '../../../icons/ic20/contact.svg';
import { globalOutgoingMailData } from '../../../stores/outgoingMailData';
import { invariant } from '../../../utils/invariant';
import { useAutoSizeTextArea } from '../../../utils/useAutoSizeTextArea';
import { OtcLayout } from '../components/otcLayout/otcLayout';
import css from './OtcChatPage.module.scss';
import { TradingForm, TradingFormData } from './tradingForm/tradingForm';

export function OtcChatPage() {
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
			<div className={css.chat}>
				<div className={css.messages} />

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
}

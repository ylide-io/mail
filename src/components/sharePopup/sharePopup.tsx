import { RefObject } from 'react';
import {
	EmailShareButton,
	FacebookShareButton,
	TelegramShareButton,
	TwitterShareButton,
	WhatsappShareButton,
} from 'react-share';

import { OutgoingMailData } from '../../stores/outgoingMailData';
import { HorizontalAlignment } from '../../utils/alignment';
import { plainTextToEditorData } from '../../utils/editorJs';
import { useComposeMailPopup } from '../composeMailPopup/composeMailPopup';
import { AnchoredPopup } from '../popup/anchoredPopup/anchoredPopup';
import { ReactComponent as FacebookSvg } from './icons/facebook.svg';
import { ReactComponent as MailSvg } from './icons/mail.svg';
import { ReactComponent as TelegramSvg } from './icons/telegram.svg';
import { ReactComponent as TwitterSvg } from './icons/twitter.svg';
import { ReactComponent as WhatsappSvg } from './icons/whatsapp.svg';
import { ReactComponent as YlideSvg } from './icons/ylide.svg';
import css from './sharePopup.module.scss';

export interface SharePopupProps {
	anchorRef: RefObject<HTMLElement>;
	horizontalAlign?: HorizontalAlignment;
	onClose: () => void;

	url?: string;
	subject: string;
}

export function SharePopup({ anchorRef, horizontalAlign, onClose, url, subject }: SharePopupProps) {
	const realUrl = url || window.location.toString();

	const composeMailPopup = useComposeMailPopup();

	return (
		<AnchoredPopup
			anchorRef={anchorRef}
			className={css.root}
			horizontalAlign={horizontalAlign}
			onCloseRequest={onClose}
		>
			<div className={css.content}>
				<button
					className={css.button}
					title="Share via Ylide"
					onClick={() => {
						const mailData = new OutgoingMailData();
						mailData.subject = subject;
						mailData.editorData = plainTextToEditorData(realUrl);

						composeMailPopup({ mailData });

						onClose();
					}}
				>
					<YlideSvg />
				</button>

				<FacebookShareButton className={css.button} url={realUrl} quote={subject}>
					<FacebookSvg />
				</FacebookShareButton>

				<TelegramShareButton className={css.button} url={realUrl} title={subject}>
					<TelegramSvg />
				</TelegramShareButton>

				<TwitterShareButton className={css.button} url={realUrl} title={subject}>
					<TwitterSvg />
				</TwitterShareButton>

				<WhatsappShareButton className={css.button} url={realUrl} title={subject}>
					<WhatsappSvg />
				</WhatsappShareButton>

				<EmailShareButton className={css.button} url={realUrl} subject={subject}>
					<MailSvg />
				</EmailShareButton>
			</div>
		</AnchoredPopup>
	);
}

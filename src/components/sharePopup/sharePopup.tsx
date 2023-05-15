import { RefObject } from 'react';
import {
	EmailShareButton,
	FacebookShareButton,
	TelegramShareButton,
	TwitterShareButton,
	WhatsappShareButton,
} from 'react-share';

import { AppMode, REACT_APP__APP_MODE } from '../../env';
import { OutgoingMailData } from '../../stores/outgoingMailData';
import { HorizontalAlignment } from '../../utils/alignment';
import { copyToClipboard } from '../../utils/clipboard';
import { plainTextToEditorJsData, useOpenMailCopmpose } from '../../utils/mail';
import { AnchoredPopup } from '../popup/anchoredPopup/anchoredPopup';
import { toast } from '../toast/toast';
import { ReactComponent as ClipboardSvg } from './icons/clipboard.svg';
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

	const openMailCopmpose = useOpenMailCopmpose();

	return (
		<AnchoredPopup
			anchorRef={anchorRef}
			className={css.root}
			horizontalAlign={horizontalAlign}
			alignerOptions={{
				fitLeftToViewport: true,
			}}
			onCloseRequest={onClose}
		>
			<div className={css.content}>
				<div className={css.primaryButtons}>
					{REACT_APP__APP_MODE !== AppMode.MAIN_VIEW && (
						<button
							className={css.primaryButton}
							onClick={() => {
								const mailData = new OutgoingMailData();
								mailData.subject = subject;
								mailData.editorData = plainTextToEditorJsData(realUrl);

								openMailCopmpose({ mailData });

								onClose();
							}}
						>
							<YlideSvg className={css.icon} />
							Share via Ylide Mail
						</button>
					)}

					<button
						className={css.primaryButton}
						onClick={() => {
							copyToClipboard(realUrl);
							toast('Link copied to clipboard 👍');
							onClose();
						}}
					>
						<ClipboardSvg className={css.icon} />
						Copy link to clipboard
					</button>
				</div>

				<div className={css.divider} />

				<div className={css.bottomButtons}>
					<FacebookShareButton className={css.bottomButton} url={realUrl} quote={subject}>
						<FacebookSvg className={css.icon} />
					</FacebookShareButton>

					<TelegramShareButton className={css.bottomButton} url={realUrl} title={subject}>
						<TelegramSvg className={css.icon} />
					</TelegramShareButton>

					<TwitterShareButton className={css.bottomButton} url={realUrl} title={subject}>
						<TwitterSvg className={css.icon} />
					</TwitterShareButton>

					<WhatsappShareButton className={css.bottomButton} url={realUrl} title={subject}>
						<WhatsappSvg className={css.icon} />
					</WhatsappShareButton>

					<EmailShareButton className={css.bottomButton} url={realUrl} subject={subject}>
						<MailSvg className={css.icon} />
					</EmailShareButton>
				</div>
			</div>
		</AnchoredPopup>
	);
}

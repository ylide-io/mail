import { Modal } from '../../../../components/modal/modal';
import css from './iframePopup.module.scss';

export interface IframePopupProps {
	isMinimized: boolean;
	onMinimize: () => void;

	onClose: () => void;
}

export function IframePopup({ isMinimized, onMinimize, onClose }: IframePopupProps) {
	return (
		<Modal className={css.root} isMinimized={isMinimized} onMinimize={onMinimize} onClose={onClose}>
			<iframe className={css.iframe} title="AirSwap" src="https://trader.airswap.io/" />
		</Modal>
	);
}

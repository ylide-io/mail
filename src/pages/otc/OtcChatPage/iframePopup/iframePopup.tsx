import { Modal } from '../../../../components/modal/modal';
import css from './iframePopup.module.scss';

export interface IframePopupProps {
	onClose: () => void;
}

export function IframePopup({ onClose }: IframePopupProps) {
	return (
		<Modal className={css.root} onClose={onClose}>
			<iframe className={css.iframe} title="AirSwap" src="https://trader.airswap.io/" />
		</Modal>
	);
}

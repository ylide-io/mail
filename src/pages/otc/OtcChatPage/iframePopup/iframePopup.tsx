import { Modal } from '../../../../components/modal/modal';
import css from './iframePopup.module.scss';

export interface IframePopupProps {
	isFolded: boolean;
	onFold: (isFolded: boolean) => void;

	onClose: () => void;
}

export function IframePopup({ isFolded, onFold, onClose }: IframePopupProps) {
	return (
		<Modal className={css.root} isFolded={isFolded} onFold={onFold} onClose={onClose}>
			<iframe className={css.iframe} title="AirSwap" src="https://trader.airswap.io/" />
		</Modal>
	);
}

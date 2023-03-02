import { Modal } from '../../../../components/modal/modal';
import { REACT_APP__OTC_PROVIDER } from '../../../../env';
import { getOtcProviderUrl } from '../../otc';
import css from './iframePopup.module.scss';

export interface IframePopupProps {
	isMinimized: boolean;
	onMinimize: () => void;

	onClose: () => void;
}

export function IframePopup({ isMinimized, onMinimize, onClose }: IframePopupProps) {
	return (
		<Modal className={css.root} isMinimized={isMinimized} onMinimize={onMinimize} onClose={onClose}>
			<iframe className={css.iframe} title="AirSwap" src={getOtcProviderUrl(REACT_APP__OTC_PROVIDER)} />
		</Modal>
	);
}

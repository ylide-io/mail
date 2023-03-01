import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { ReactComponent as AirSwapSvg } from './airswap.svg';
import css from './tradingForm.module.scss';

export interface TradingFormProps {
	onTradeClick: () => void;
}

export function TradingForm({ onTradeClick }: TradingFormProps) {
	return (
		<div>
			<ActionButton
				className={css.tradeButton}
				size={ActionButtonSize.Large}
				look={ActionButtonLook.PRIMARY}
				onClick={() => onTradeClick()}
			>
				Trade
			</ActionButton>

			<div className={css.provider}>
				<div className={css.providerTitle}>Powered by:</div>

				<AirSwapSvg className={css.providerLogo} />
			</div>
		</div>
	);
}

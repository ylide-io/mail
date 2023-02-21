import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { Select } from '../../../../components/select/select';
import { TextField } from '../../../../components/textField/textField';
import css from './tradingForm.module.scss';

export interface TradingFormData {
	send: {
		amount: string;
		token?: string;
	};
	receive: {
		amount: string;
		token?: string;
	};
}

export interface TradingFormProps {
	data: TradingFormData;
	onChange: (data: TradingFormData) => void;
}

export function TradingForm({ data, onChange }: TradingFormProps) {
	return (
		<div className={css.root}>
			<div className={css.currencyTitle}>You pay</div>
			<div className={css.currency}>
				<TextField
					className={css.amountInput}
					value={data.send.amount}
					onValueChange={amount => onChange({ ...data, send: { ...data.send, amount } })}
				/>
				<Select />
			</div>

			<div className={css.currencyTitle}>You receive</div>
			<div className={css.currency}>
				<TextField
					className={css.amountInput}
					value={data.receive.amount}
					onValueChange={amount => onChange({ ...data, receive: { ...data.receive, amount } })}
				/>
				<Select />
			</div>

			<div className={css.comission}>Commission: 0.25%</div>

			<ActionButton className={css.tradeButton} size={ActionButtonSize.Large} look={ActionButtonLook.PRIMARY}>
				Trade
			</ActionButton>
		</div>
	);
}

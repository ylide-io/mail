import clsx from 'clsx';
import { observer } from 'mobx-react';

import { feedSettings } from '../../stores/FeedSettings';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { CheckBox } from '../checkBox/checkBox';
import css from './coverageModal.module.scss';

type Props = {
	onClose?: () => void;
	account: DomainAccount;
};

export const CoverageModal = observer(({ onClose, account }: Props) => {
	const coverage = feedSettings.coverages.get(account);

	const onClick = () => {
		onClose?.();
	};

	// TODO: KONST
	if (!coverage || coverage === 'loading') {
		return <div>Loading</div>;
	}

	if (coverage === 'error') {
		return <div>Error</div>;
	}

	const getRowText = (row: {
		tokenId: string;
		missing: boolean;
		projectName: string | null;
		name: string | null;
		symbol: string | null;
	}) => {
		if (row.projectName) {
			if (row.symbol) {
				return `${row.projectName} (${row.symbol})`;
			}
			return row.projectName;
		}
		if (row.name) {
			if (row.symbol) {
				return `${row.name} (${row.symbol})`;
			}
			return row.name;
		}
		return row.tokenId;
	};

	return (
		<ActionModal
			title="Current coverage of your blockchain activity"
			buttons={
				<ActionButton size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY} onClick={onClick}>
					Close
				</ActionButton>
			}
		>
			<div>We guarantee our users to have a 100% coverage within 3 days from registration.</div>
			<div>
				<div className={css.list}>
					<div className={css.section}>
						<div>Tokens</div>
						<div>
							${coverage.tokens.usdCovered} / ${coverage.tokens.usdTotal} ({coverage.tokens.ratioUsd}%)
						</div>
					</div>
					{coverage.tokens.items.length === 0 && <div className={css.nothing}>You have no tokens</div>}
					{coverage.tokens.items.map(t => (
						<div>
							<div className={clsx(css.row, css.row_data)}>
								<CheckBox className={css.sourceCheckBox} isChecked={!t.missing} isDisabled />
								<div className={css.sourceName}>
									<div className={css.sourceNameText}>{getRowText(t)}</div>
								</div>
							</div>
						</div>
					))}
					<div className={css.section}>
						<div>Protocols</div>
						<div>
							${coverage.protocols.usdCovered} / ${coverage.protocols.usdTotal} (
							{coverage.protocols.ratioUsd}%)
						</div>
					</div>
					{coverage.protocols.items.length === 0 && (
						<div className={css.nothing}>You have no positions in protocols</div>
					)}
					{coverage.protocols.items.map(t => (
						<div>
							<div className={clsx(css.row, css.row_data)}>
								<CheckBox className={css.sourceCheckBox} isChecked={!t.missing} isDisabled />
								<div className={css.sourceName}>
									<div className={css.sourceNameText}>{getRowText(t)}</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</ActionModal>
	);
});

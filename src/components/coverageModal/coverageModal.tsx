import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useMemo } from 'react';

import { FeedManagerApi } from '../../api/feedManagerApi';
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

	const uniq = (items: FeedManagerApi.CoverageItem[]) => {
		const unique: FeedManagerApi.CoverageItem[] = [];
		const seenValues = new Set();
		for (const item of items) {
			if (!seenValues.has(item.projectName)) {
				seenValues.add(item.projectName);
				unique.push(item);
			}
		}
		return unique;
	};

	const uniqTokens = useMemo(() => {
		if (!coverage || coverage === 'error' || coverage === 'loading') {
			return [];
		}
		return uniq(coverage.tokens.items);
	}, [coverage]);

	const uniqProtocols = useMemo(() => {
		if (!coverage || coverage === 'error' || coverage === 'loading') {
			return [];
		}
		return uniq(coverage.protocols.items);
	}, [coverage]);

	const getRowText = (row: {
		tokenId: string;
		missing: boolean;
		projectName: string | null;
		name: string | null;
		symbol: string | null;
	}) => {
		if (row.projectName) {
			if (row.name) {
				return `${row.projectName} ($${row.symbol})`;
			}
			return row.projectName;
		} else if (row.symbol) {
			return `- ($${row.symbol})`;
		}
		return row.tokenId;
	};

	// TODO: KONST
	if (!coverage || coverage === 'loading') {
		return <div>Loading</div>;
	}

	if (coverage === 'error') {
		return <div>Error</div>;
	}

	return (
		<ActionModal
			title="Current coverage of your blockchain activity"
			buttons={
				<ActionButton size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY} onClick={onClick}>
					Close
				</ActionButton>
			}
		>
			<div>
				<div className={css.disclaimer}>
					We guarantee our users to have a 100% coverage within 3 days from registration.
				</div>
				<div className={css.total}>Total coverage - {coverage.totalCoverage}%</div>
				<div>
					<div className={css.list}>
						<div className={css.section}>
							<div>Tokens</div>
							<div>
								${coverage.tokens.usdCovered} / ${coverage.tokens.usdTotal} ({coverage.tokens.ratioUsd}
								%)
							</div>
						</div>
						{uniqTokens.length === 0 && <div className={css.nothing}>You have no tokens</div>}
						{uniqTokens.map(t => (
							<div>
								<div className={clsx(css.row, css.row_data)}>
									<CheckBox className={css.sourceCheckBox} isChecked={!t.missing} isDisabled />
									<div>{getRowText(t)}</div>
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
						{uniqProtocols.length === 0 && (
							<div className={css.nothing}>You have no positions in protocols</div>
						)}
						{uniqProtocols.map(t => (
							<div className={clsx(css.row, css.row_data)}>
								<CheckBox isChecked={!t.missing} isDisabled />
								<div>{getRowText(t)}</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</ActionModal>
	);
});

import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useMemo } from 'react';

import { FeedManagerApi } from '../../api/feedManagerApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { CheckBox } from '../checkBox/checkBox';
import css from './coverageModal.module.scss';

type Props = {
	coverage: FeedManagerApi.Coverage;
	onClose?: () => void;
};

export const CoverageModal = observer(({ onClose, coverage }: Props) => {
	const uniq = (items: FeedManagerApi.CoverageItem[]) => {
		const unique: FeedManagerApi.CoverageItem[] = [];
		const seenValues = new Set();
		for (const item of items) {
			const feature = item.projectName || item.symbol || item.tokenId;
			if (!seenValues.has(feature)) {
				seenValues.add(feature);
				unique.push(item);
			}
		}
		return unique;
	};

	const uniqTokens = useMemo(() => {
		return uniq(coverage.tokens.items).sort((a, b) => Number(a.missing) - Number(b.missing));
	}, [coverage]);

	const uniqProtocols = useMemo(() => {
		return uniq(coverage.protocols.items).sort((a, b) => Number(a.missing) - Number(b.missing));
	}, [coverage]);

	const getRowTextToken = (row: {
		tokenId: string;
		missing: boolean;
		projectName: string | null;
		name: string | null;
		symbol: string | null;
	}) => {
		if (row.projectName) {
			if (row.symbol) {
				return `${row.projectName} ($${row.symbol})`;
			}
			return row.projectName;
		} else if (row.symbol) {
			return `- ($${row.symbol})`;
		}
		return row.tokenId;
	};

	const getRowTextProtocol = (row: {
		tokenId: string;
		missing: boolean;
		projectName: string | null;
		name: string | null;
		symbol: string | null;
	}) => {
		return row.projectName || row.tokenId;
	};

	return (
		<ActionModal
			title="Current coverage of your blockchain activity"
			buttons={
				<ActionButton
					size={ActionButtonSize.XLARGE}
					look={ActionButtonLook.PRIMARY}
					onClick={() => {
						onClose?.();
					}}
				>
					Close
				</ActionButton>
			}
			onClose={onClose}
		>
			<div>
				<div className={css.disclaimer}>
					We guarantee our users to have a 100% coverage within 3 days from registration.
				</div>
				<div className={css.total}>Total coverage - {coverage.totalCoverage}</div>
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
									<div>{getRowTextToken(t)}</div>
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
								<div>{getRowTextProtocol(t)}</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</ActionModal>
	);
});

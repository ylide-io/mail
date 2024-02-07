import clsx from 'clsx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import { ComputedPortfolio, PortfolioSource } from '../../shared/PortfolioScope';
import { blockchainNames } from '../../utils/blockchainNames';
import { formatUsdExt } from '../../utils/formatUsdExt';
import css from './feedSettingsModal.module.scss';

interface ProjectExposureTableProps {
	portfolioSources: PortfolioSource[];
	portfolio: ComputedPortfolio;
	projectId: number;
}

@observer
export class ProjectExposureTable extends PureComponent<ProjectExposureTableProps> {
	render() {
		const { portfolio, portfolioSources, projectId } = this.props;
		const meta = portfolio.projectToPortfolioMetaMap[projectId];

		if (meta?.exposure) {
			return (
				<div className={css.balancePopup}>
					{portfolioSources
						.map((s, idx) => ({
							portfolioSource: s,
							portfolioSourceExposureData: meta.exposure!.exposurePerPortfolioSource[idx],
						}))
						.filter(s => s.portfolioSourceExposureData.total > 0)
						.map(s => (
							<div className={css.balanceBlock} key={s.portfolioSource.id}>
								{portfolioSources.length > 1 && (
									<div className={css.balanceTitle}>{s.portfolioSource.id}</div>
								)}
								<table className={css.balanceTable}>
									<thead>
										<tr>
											<th className={clsx(css.bthValue, css.btValue)}>Value</th>
											<th className={clsx(css.bthToken, css.btToken)}>Token</th>
											<th className={clsx(css.bthChain, css.btChain)}>Chain</th>
											<th className={clsx(css.bthProject, css.btProject)}>Where</th>
										</tr>
									</thead>
									<tbody>
										{s.portfolioSourceExposureData.entries.map((entry, idx) => (
											<tr className={css.balanceRow} key={idx}>
												<td className={clsx(css.btdValue, css.btValue)}>
													{formatUsdExt(entry.leftValueUsd)}
												</td>
												<td className={clsx(css.btdToken, css.btToken)}>{entry.left.symbol}</td>
												<td className={clsx(css.btdChain, css.btChain)}>
													{entry.right
														? blockchainNames[entry.right.id.split(':')[0]] ||
														  entry.right.id.split(':')[0]
														: blockchainNames[entry.left.id.split(':')[0]] ||
														  entry.left.id.split(':')[0]}
												</td>
												<td className={clsx(css.btdProject, css.btProject)}>
													{entry.right ? `in protocol` : 'on balance'}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						))}
				</div>
			);
		} else {
			return null;
		}
	}
}

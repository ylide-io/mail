import { ReactNode } from 'react';

import css from './otcAsideStatistics.module.scss';

export interface StatisticsRow {
	title: ReactNode;
	description: ReactNode;
}

export interface OtcAsideStatisticsProps {
	rows: StatisticsRow[];
}

export function OtcAsideStatistics({ rows }: OtcAsideStatisticsProps) {
	return (
		<div className={css.root}>
			{rows.map((row, i) => (
				<div key={i} className={css.row}>
					<div className={css.title}>{row.title}</div>
					<div className={css.description}>{row.description}</div>
				</div>
			))}
		</div>
	);
}

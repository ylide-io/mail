import clsx from 'clsx';
import { ReactNode } from 'react';

import { PropsWithClassName } from '../../../../components/props';
import css from './otcTable.module.scss';

export interface ColumnProp extends PropsWithClassName {
	title: ReactNode;
	gridSize: string;
}

export interface DataRowProp {
	content: ReactNode[];
	onClick?: () => void;
}

export interface OtcTableProps {
	columns: ColumnProp[];
	data: DataRowProp[];
}

export function OtcTable({ columns, data }: OtcTableProps) {
	const gridTemplateColumns = columns.map(c => c.gridSize).join(' ');

	return (
		<div className={css.root}>
			<div className={clsx(css.row, css.row_head)} style={{ gridTemplateColumns }}>
				{columns.map((column, i) => (
					<div key={i}>{column.title}</div>
				))}
			</div>

			{data.length ? (
				data.map((row, i) => (
					<div
						key={i}
						className={clsx(css.row, css.row_data, row.onClick && css.row_clickable)}
						style={{ gridTemplateColumns }}
						onClick={row.onClick}
					>
						{columns.map((column, i) => (
							<div key={i} className={clsx(css.cell, column.className)}>
								{row.content[i]}
							</div>
						))}
					</div>
				))
			) : (
				<div className={css.empty}>– No data –</div>
			)}
		</div>
	);
}

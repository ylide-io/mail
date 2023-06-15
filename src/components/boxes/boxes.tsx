import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { PropsWithClassName } from '../props';
import css from './boxes.module.scss';

interface TruncateTextBoxProps extends PropsWithChildren<{}>, PropsWithClassName {}

export function TruncateTextBox({ children, className }: TruncateTextBoxProps) {
	return <div className={clsx(css.truncateText, className)}>{children}</div>;
}

//

export interface GridRowBoxProps extends PropsWithChildren<{}>, PropsWithClassName {
	gap?: number;
}

export function GridRowBox({ children, className, gap }: GridRowBoxProps) {
	return (
		<div className={clsx(css.gridRow, className)} style={{ gridGap: gap }}>
			{children}
		</div>
	);
}

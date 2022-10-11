import cn from 'classnames';
import { MouseEvent } from 'react';

import './style.scss';

export const YlideCheckbox = ({
	checked,
	onCheck,
}: {
	checked?: boolean;
	onCheck: (val: boolean, e: MouseEvent) => void;
}) => {
	return (
		<div
			className={cn('ylide-checkbox', { checked })}
			onClick={e => {
				onCheck(!checked, e);
			}}
		>
			{checked ? (
				<div
					style={{
						width: 5,
						height: 10,
						border: 'solid white',
						borderWidth: '0 3px 3px 0',
						transform: 'rotate(45deg)',
					}}
				/>
			) : null}
		</div>
	);
};

import { MouseEvent } from 'react';
import clsx from 'clsx';

export const YlideCheckbox = ({
	checked,
	onCheck,
}: {
	checked?: boolean;
	onCheck: (val: boolean, e: MouseEvent) => void;
}) => {
	return (
		<div
			className={clsx('ylide-checkbox', { checked })}
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

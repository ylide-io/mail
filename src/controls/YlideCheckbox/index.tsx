import cn from 'classnames';

import './style.scss';

export const YlideCheckbox = ({ checked, onCheck }: { checked?: boolean; onCheck: (val: boolean) => void }) => {
	return (
		<div className={cn('ylide-checkbox', { checked })}>
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

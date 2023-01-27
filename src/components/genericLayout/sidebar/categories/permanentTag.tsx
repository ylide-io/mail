import clsx from 'clsx';
import React from 'react';

import css from './categories.module.scss';

interface PermanentTagInterface {
	onClick: () => void;
	text: string;
	active?: boolean;
}

const PermanentTag: React.FC<PermanentTagInterface> = ({ onClick, text, active }) => {
	const icon = (() => {
		switch (text) {
			case 'Inbox':
				return 'fa-inbox';
			case 'Archive':
				return 'fa-trash-o';
			case 'Sent':
				return 'fa-share';
			default:
				return '';
		}
	})();

	const styles = { cursor: 'pointer' };

	const activeStyles = {
		fontWeight: 'bold',
		backgroundColor: 'rgba(26,179,148,0.3)',
	};

	return (
		<div className={css.listItem} onClick={onClick}>
			<div className={css.listItemTitle} style={active ? { ...styles, ...activeStyles } : styles}>
				<i className={clsx('fa', icon)} /> {text}
			</div>
		</div>
	);
};

export default PermanentTag;

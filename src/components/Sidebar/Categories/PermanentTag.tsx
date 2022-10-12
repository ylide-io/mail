import React from 'react';
import classNames from 'classnames';

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

	const styles = { cursor: 'pointer', padding: '5px 10px' };

	const activeStyles = {
		fontWeight: 'bold',
		backgroundColor: 'rgba(26,179,148,0.15)',
	};

	return (
		<li onClick={onClick}>
			<div style={active ? { ...styles, ...activeStyles } : styles}>
				<i className={classNames('fa', icon)} /> {text}
			</div>
		</li>
	);
};

export default PermanentTag;

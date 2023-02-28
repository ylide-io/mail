import React from 'react';

import { ReactComponent as ArchiveSvg } from '../../../../icons/archive.svg';
import { ReactComponent as InboxSvg } from '../../../../icons/inbox.svg';
import { ReactComponent as SentSvg } from '../../../../icons/sent.svg';
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
				return <InboxSvg />;
			case 'Archive':
				return <SentSvg />;
			case 'Sent':
				return <ArchiveSvg />;
			default:
				throw new Error('Unknown tag');
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
				{icon} {text}
			</div>
		</div>
	);
};

export default PermanentTag;

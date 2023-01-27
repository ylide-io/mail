import clsx from 'clsx';
import React from 'react';
import { useLocation } from 'react-router-dom';

import modals from '../../../../stores/Modals';
import { useNav } from '../../../../utils/navigate';
import css from './categories.module.scss';

interface TagProps {
	circleColor: string;
	text: string;
	tagId?: number;
	isActive?: boolean;
	icon: string;
}

const Tag: React.FC<TagProps> = ({ icon, circleColor, text, isActive, tagId }) => {
	const location = useLocation();
	const navigate = useNav();

	const styles = { cursor: 'pointer' };

	const activeStyles = {
		fontWeight: 'bold',
		backgroundColor: 'rgba(26,179,148,0.15)',
	};

	const clickHandler = () => {
		if (location.pathname !== `/${tagId}`) {
			navigate(`/${tagId}`);
			modals.sidebarOpen = false;
		}
		// mailer.filterByFolder(tagId || null);
	};

	return (
		<div className={css.listItem} onClick={clickHandler}>
			<div className={css.listItemTitle} style={isActive ? { ...styles, ...activeStyles } : styles}>
				<i className={clsx('fa fa-circle text-navy')} style={{ color: circleColor }} /> {text}
			</div>
		</div>
	);
};

export default Tag;

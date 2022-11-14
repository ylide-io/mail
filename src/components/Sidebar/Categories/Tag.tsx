import React from 'react';
import classNames from 'classnames';
import { useLocation } from 'react-router-dom';
import { useNav } from '../../../utils/navigate';

interface TagProps {
	circleColor: string;
	text: string;
	tagId?: number;
	isActive?: boolean;
}

const Tag: React.FC<TagProps> = ({ circleColor, text, isActive, tagId }) => {
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
		}
		// mailer.filterByFolder(tagId || null);
	};

	return (
		<div className="tag-list-item" onClick={clickHandler}>
			<div className="tag-list-item-title" style={isActive ? { ...styles, ...activeStyles } : styles}>
				<i className={classNames('fa fa-circle text-navy')} style={{ color: circleColor }} /> {text}
			</div>
		</div>
	);
};

export default Tag;

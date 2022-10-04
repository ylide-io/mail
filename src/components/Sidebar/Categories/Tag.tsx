import React from 'react';
import classNames from 'classnames';
import { colors } from '../../../utils/colors';
import mailer from '../../../stores/Mailer';
import { useLocation } from 'react-router-dom';
import { useNav } from '../../../utils/navigate';

interface TagProps {
	circleColor: colors;
	text: string;
	tagId?: number;
	isActive?: boolean;
}

const Tag: React.FC<TagProps> = ({ circleColor, text, isActive, tagId }) => {
	const location = useLocation();
	const navigate = useNav();

	const styles = { cursor: 'pointer', padding: '5px 10px' };

	const activeStyles = {
		fontWeight: 'bold',
		backgroundColor: 'rgba(26,179,148,0.15)',
	};

	const clickHandler = () => {
		if (location.pathname !== 'mailbox') {
			navigate('/mailbox');
		}
		// mailer.filterByFolder(tagId || null);
	};

	return (
		<li onClick={clickHandler} style={isActive ? { ...activeStyles, ...styles } : styles}>
			<div>
				<i className={classNames('fa fa-circle text-navy', `text-${circleColor}`)} />
				<span>{text}</span>
			</div>
		</li>
	);
};

export default Tag;

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import { useNav } from '../../utils/navigate';

interface LinkButtonProps {
	text: string;
	link: string;
}

const LinkButton: React.FC<LinkButtonProps> = ({ text, link }) => {
	const nav = useNav();
	return (
		<Button
			className="sidebar-button"
			type={link !== `/compose` ? 'default' : 'primary'}
			size="large"
			icon={link !== `/compose` ? <ArrowLeftOutlined /> : null}
			onClick={() => nav(link)}
		>
			{text}
		</Button>
	);
};

export default LinkButton;

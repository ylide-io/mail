import React, { ReactNode } from 'react';
import Header from '../components/Header/Header';
import SidebarMenu from '../components/Sidebar/SidebarMenu';

import './style.scss';

interface GenericLayoutProps {
	children: ReactNode;
}

const GenericLayout: React.FC<GenericLayoutProps> = ({ children }) => {
	return (
		<div className="main-layout">
			<Header />
			<div className="main-wrapper">
				<SidebarMenu />
				{children}
			</div>
		</div>
	);
};

export default GenericLayout;

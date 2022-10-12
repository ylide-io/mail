import React, { ReactNode } from 'react';
import Header from '../components/Header/Header';
import SidebarMenu from '../components/Sidebar/SidebarMenu';

import './style.scss';

interface MainLayoutProps {
	children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
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

export default MainLayout;

import React, { ReactNode } from 'react';
import Header from '../components/Header/Header';
import SidebarMenu from '../components/Sidebar/SidebarMenu';

interface GenericLayoutProps {
	children: ReactNode;
}

const GenericLayout: React.FC<GenericLayoutProps> = ({ children }) => {
	return (
		<div className="main-layout">
			<Header />
			<div className="main-wrapper">
				<SidebarMenu />
				<div className="main-block main-content">{children}</div>
			</div>
		</div>
	);
};

export default GenericLayout;

import React, {ReactNode} from 'react';
import Header from "../components/Header/Header";
import SidebarMenu from "../components/Sidebar/SidebarMenu";

interface MainLayoutProps {
    children: ReactNode
}

const MainLayout:React.FC<MainLayoutProps> = ({children}) => {
    return (
        <div id="page-wrapper" className="gray-bg">
            <Header/>
            <div className="wrapper wrapper-content">
                <div className="row">
                    <SidebarMenu/>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default MainLayout;

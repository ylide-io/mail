import clsx from 'clsx';
import { observer } from 'mobx-react';
import { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import css from './genericLayout.module.scss';
import Header from './header/header';
import { isSidebarOpen, SidebarBurger, SidebarMenu } from './sidebar/sidebarMenu';

interface GenericLayoutApi {
	scrollToTop: () => void;
}

const GenericLayoutApiContext = createContext<GenericLayoutApi | undefined>(undefined);

export const useGenericLayoutApi = () => useContext(GenericLayoutApiContext)!;

//

interface GenericLayoutProps extends PropsWithChildren {}

export const GenericLayout = observer(({ children }: GenericLayoutProps) => {
	const api: GenericLayoutApi = useMemo(
		() => ({
			scrollToTop: () => {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			},
		}),
		[],
	);

	return (
		<GenericLayoutApiContext.Provider value={api}>
			<div className={css.root}>
				<Header />

				<div className={css.main}>
					<div className={clsx(css.sidebar, isSidebarOpen.get() && css.sidebar_open)}>
						<div className={css.sidebarMobileHeader}>
							<SidebarBurger>Hide sidebar</SidebarBurger>
						</div>

						<SidebarMenu />
					</div>

					<div className={css.content}>{children}</div>
				</div>
			</div>
		</GenericLayoutApiContext.Provider>
	);
});

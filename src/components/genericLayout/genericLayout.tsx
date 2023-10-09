import clsx from 'clsx';
import { observer } from 'mobx-react';
import { createContext, PropsWithChildren, useContext, useLayoutEffect, useMemo } from 'react';

import { useBodyHiddenOverflow } from '../../utils/useBodyHiddenOverflow';
import { Overlay } from '../overlay/overlay';
import { PopupManagerPortalLevel } from '../popup/popupManager/popupManager';
import css from './genericLayout.module.scss';
import { Header } from './header/header';
import { SearchField } from './header/searchField/searchField';
import { isSidebarOpen, SidebarBurger, SidebarMenu } from './sidebar/sidebarMenu';

interface GenericLayoutApi {
	scrollToTop: () => void;
}

const GenericLayoutApiContext = createContext<GenericLayoutApi | undefined>(undefined);

export const useGenericLayoutApi = () => useContext(GenericLayoutApiContext)!;

//

interface GenericLayoutProps extends PropsWithChildren {
	dontResetScrollOnMount?: undefined;
}

export const GenericLayout = observer(({ children, dontResetScrollOnMount }: GenericLayoutProps) => {
	useLayoutEffect(() => {
		if (!dontResetScrollOnMount) {
			window.scrollTo(0, 0);
		}
	}, [dontResetScrollOnMount]);

	useBodyHiddenOverflow(isSidebarOpen.get());

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
				<Header className={css.header} />

				<div className={css.main}>
					{isSidebarOpen.get() && (
						<Overlay
							className={css.sidebarOverlay}
							portalLevel={PopupManagerPortalLevel.NO_PORTAL}
							onClick={() => isSidebarOpen.set(false)}
						/>
					)}

					<div className={clsx(css.sidebar, isSidebarOpen.get() && css.sidebar_open)}>
						<div className={css.sidebarMobileHeader}>
							<SidebarBurger>Hide sidebar</SidebarBurger>
						</div>

						<SearchField className={css.sidebarSearch} />

						<SidebarMenu />
					</div>

					<div className={css.content}>{children}</div>
				</div>
			</div>
		</GenericLayoutApiContext.Provider>
	);
});

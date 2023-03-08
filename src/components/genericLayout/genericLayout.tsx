import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef } from 'react';

import domain from '../../stores/Domain';
import { useNav } from '../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { TransactionPopup } from '../TransactionPopup/TransactionPopup';
import css from './genericLayout.module.scss';
import Header from './header/header';
import SidebarMenu from './sidebar/sidebarMenu';

interface GenericLayoutApi {
	scrollToTop: () => void;
}

const GenericLayoutApiContext = createContext<GenericLayoutApi | undefined>(undefined);

export const useGenericLayoutApi = () => useContext(GenericLayoutApiContext)!;

//

interface GenericLayoutProps {
	children: ReactNode;
	mainClass?: string;
	isCustomContent?: boolean;
	mobileTopButtonProps?: {
		text: string;
		link: string;
	};
}

export const GenericLayout = observer(
	({ children, mainClass, isCustomContent, mobileTopButtonProps }: GenericLayoutProps) => {
		const navigate = useNav();

		useEffect(() => {
			setTimeout(() => {
				// @ts-ignore
				window.WonderPush = window.WonderPush || [];
				// @ts-ignore
				WonderPush.push([
					'init',
					{
						webKey: '0ae1e313db96a1e743f93f73f2130261b6efd43953263299400632d700599fa6',
					},
				]);
			}, 10000);
		}, []);

		const mainRef = useRef<HTMLDivElement>(null);

		const api: GenericLayoutApi = useMemo(
			() => ({
				scrollToTop: () => {
					if (mainRef.current) {
						mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
					}
				},
			}),
			[],
		);

		return (
			<GenericLayoutApiContext.Provider value={api}>
				<div className={css.root}>
					<Header />
					{domain.txPlateVisible ? <TransactionPopup /> : null}
					<div className={css.main} ref={mainRef}>
						<SidebarMenu />

						<div className={clsx(css.content, isCustomContent && css.content_custom, mainClass)}>
							{!!mobileTopButtonProps && (
								<ActionButton
									className={css.linkButton}
									size={ActionButtonSize.LARGE}
									look={ActionButtonLook.PRIMARY}
									onClick={() => navigate(mobileTopButtonProps.link)}
								>
									{mobileTopButtonProps.text}
								</ActionButton>
							)}

							{children}
						</div>
					</div>
				</div>
			</GenericLayoutApiContext.Provider>
		);
	},
);

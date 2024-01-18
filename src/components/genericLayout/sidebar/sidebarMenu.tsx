import clsx from 'clsx';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { AnchorHTMLAttributes, Fragment, PropsWithChildren, ReactNode } from 'react';
import { generatePath, useLocation } from 'react-router-dom';

import { ReactComponent as AddContactSvg } from '../../../icons/ic20/addContact.svg';
import { ReactComponent as ArrowDownSvg } from '../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as ContactSvg } from '../../../icons/ic20/contact.svg';
import { ReactComponent as SettingsSvg } from '../../../icons/ic20/settings.svg';
import { ReactComponent as SidebarMenuSvg } from '../../../icons/ic28/sidebarMenu.svg';
import { ReactComponent as SidebarMenuCloseSvg } from '../../../icons/ic28/sidebarMenu_close.svg';
import { ReactComponent as TwitterSvg } from '../../../icons/social/twitter.svg';
import { sideFeedIcon } from '../../../icons/static/sideFeedIcon';
import { SettingsSection } from '../../../pages/settings/settingsPage';
import { analytics } from '../../../stores/Analytics';
import { browserStorage } from '../../../stores/browserStorage';
import domain from '../../../stores/Domain';
import { RoutePath } from '../../../stores/routePath';
import { constrain } from '../../../utils/number';
import { isTrialActive } from '../../../utils/payments';
import { useNav } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
import { AdaptiveAddress } from '../../adaptiveAddress/adaptiveAddress';
import { AdaptiveText } from '../../adaptiveText/adaptiveText';
import { PropsWithClassName } from '../../props';
import { toast } from '../../toast/toast';
import css from './sidebarMenu.module.scss';

export const isSidebarOpen = observable.box(false);

export enum Section {
	VENOM_PROJECTS = 'venom_projects',
	TVM_PROJECTS = 'tvm_projects',
	FEED = 'feed',
	FEED_DISCOVERY = 'feed_discovery',
	MAIL = 'mail',
	OTC = 'otc',
}

//

interface SidebarBurgerProps extends PropsWithClassName, PropsWithChildren<{}> {}

export const SidebarBurger = observer(({ className, children }: SidebarBurgerProps) => (
	<div className={clsx(css.burger, className)}>
		<ActionButton
			size={ActionButtonSize.MEDIUM}
			icon={isSidebarOpen.get() ? <SidebarMenuCloseSvg /> : <SidebarMenuSvg />}
			onClick={() => isSidebarOpen.set(!isSidebarOpen.get())}
		>
			{children}
		</ActionButton>
	</div>
));

//

interface SidebarSectionProps extends PropsWithChildren<{}> {
	section: Section;
	title: ReactNode;
}

const SidebarSection = observer(({ children, section, title }: SidebarSectionProps) => (
	<div className={css.section}>
		<div className={css.sectionTitle}>
			{title}
			<ActionButton
				look={ActionButtonLook.LITE}
				icon={browserStorage.isSidebarSectionFolded(section) ? <ArrowDownSvg /> : <ArrowUpSvg />}
				onClick={() => browserStorage.toggleSidebarSectionFolding(section)}
			/>
		</div>

		<div
			className={clsx(
				css.sectionContent,
				browserStorage.isSidebarSectionFolded(section) || css.sectionContent_open,
			)}
		>
			{children}
		</div>
	</div>
));

//

enum SidebarButtonLook {
	SUBMENU = 'SUBMENU',
	SECTION = 'SECTION',
}

interface SidebarButtonProps {
	look?: SidebarButtonLook;
	href: string;
	isActiveChecker?: (pathname: string) => boolean;
	icon?: ReactNode;
	disabled?: boolean;
	name: ReactNode;
	onClick?: () => void;
	rightButton?: {
		icon: ReactNode;
		title?: string;
		onClick: () => void;
	};
}

export const SidebarButton = observer(
	({ look, href, disabled, isActiveChecker, icon, name, rightButton, onClick }: SidebarButtonProps) => {
		const location = useLocation();
		const navigate = useNav();

		const isActive = location.pathname === href || isActiveChecker?.(location.pathname);

		const isExternal = !href.startsWith('/');
		const externalProps: AnchorHTMLAttributes<HTMLAnchorElement> = isExternal
			? {
					target: '_blank',
					rel: 'noreferrer',
			  }
			: {};

		const lookClass =
			look &&
			{
				[SidebarButtonLook.SUBMENU]: css.sectionLink_submenu,
				[SidebarButtonLook.SECTION]: css.sectionLink_section,
			}[look];

		return (
			<a
				{...externalProps}
				className={clsx(
					css.sectionLink,
					lookClass,
					isActive && css.sectionLink_active,
					disabled && css.sectionLink_disabled,
				)}
				href={href}
				onClick={e => {
					if (!isExternal) {
						e.preventDefault();
						isSidebarOpen.set(false);
						navigate(href);
						onClick?.();
					}
				}}
			>
				{icon && <div className={css.sectionLinkIconLeft}>{icon}</div>}
				<div className={css.sectionLinkTitle}>{name}</div>

				{rightButton && (
					<ActionButton
						className={css.sectionRightButton}
						look={ActionButtonLook.LITE}
						icon={rightButton.icon}
						title={rightButton.title}
						onClick={e => {
							e.preventDefault();
							e.stopPropagation();
							rightButton?.onClick();
						}}
					/>
				)}
			</a>
		);
	},
);

//

export const SidebarSmartFeedSection = observer(() => {
	const navigate = useNav();
	const accounts = domain.account ? [domain.account] : [];

	return (
		<SidebarSection section={Section.FEED} title="Feed">
			<SidebarButton
				href={generatePath(RoutePath.FEED_SMART)}
				icon={sideFeedIcon(14)}
				onClick={() => {
					analytics.mainviewSmartFeedClick();
				}}
				name="Smart feed"
			/>

			{accounts.map((account, i) => (
				<SidebarButton
					key={i}
					look={SidebarButtonLook.SUBMENU}
					href={generatePath(RoutePath.FEED_SMART_ADDRESS, { address: account.address })}
					icon={<ContactSvg />}
					name={<AdaptiveText text={account.address} />}
					onClick={() => {
						analytics.mainviewPersonalFeedClick(account.address);
					}}
					rightButton={{
						icon: <SettingsSvg />,
						title: 'Account Settings',
						onClick: () => {
							if (!account.mainviewKey) {
								return toast('Please complete the onboarding first ❤');
							}

							analytics.mainviewFeedSettingsClick(account.address);

							isSidebarOpen.set(false);
							navigate(
								generatePath(RoutePath.SETTINGS_ADDRESS_SECTION, {
									address: account.address,
									section: SettingsSection.SOURCES,
								}),
							);
						},
					}}
				/>
			))}
			<SidebarButton
				look={SidebarButtonLook.SUBMENU}
				href={'#'}
				disabled
				icon={<AddContactSvg />}
				name={
					<div
						style={{
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<span>Add address</span>
						<span
							style={{
								padding: '0px 2px',
								background: 'rgba(0, 0, 0, 0.1)',
								borderRadius: 3,
								fontSize: 11,
							}}
						>
							Soon
						</span>
					</div>
				}
				onClick={() => {
					//
				}}
			/>
		</SidebarSection>
	);
});

//

export const TrialPeriodSection = observer(() => {
	const trial = isTrialActive(domain.accountPlan);

	if (!domain.accountPlan || !trial || !domain.account) {
		return null;
	}

	return (
		<>
			<div className={css.divider} />

			<div className={css.trial}>
				<b>7-day trial period</b>
				<div className={css.trialProgress}>
					<div
						className={css.trialProgressValue}
						style={{
							width: `${
								constrain(
									1 - (domain.accountPlan.planEndsAt - Date.now() / 1000) / (60 * 60 * 24 * 7),
									0,
									1,
								) * 100
							}%`,
						}}
					/>
				</div>
				<AdaptiveAddress className={css.trialAddress} address={domain.account.address} maxLength={12} />
			</div>
		</>
	);
});

export const SidebarMenu = observer(() => {
	const tags = domain.feedSettings.tags;
	const navigate = useNav();

	return (
		<div className={css.root}>
			<SidebarSmartFeedSection />

			<SidebarSection section={Section.FEED_DISCOVERY} title="Discovery">
				{/* TODO: KONST */}
				{tags === 'error' ? (
					<></>
				) : tags === 'loading' ? (
					<div>Loading</div>
				) : (
					tags.map(t => (
						<SidebarButton
							key={t.id}
							href={generatePath(RoutePath.FEED_CATEGORY, { tag: t.id.toString() })}
							name={t.name}
							onClick={() => {
								analytics.mainviewTagFeedClick(t.id);
							}}
						/>
					))
				)}
			</SidebarSection>

			<TrialPeriodSection />

			<div className={css.divider} />
			<div className={css.socials}>
				<div className={css.socialItem}>
					<a
						href="https://twitter.com/mainview_io"
						target="_blank noreferrer"
						title="Twitter"
						onClick={() => analytics.mainviewTwitterClick()}
					>
						<span>Follow on</span>
						<TwitterSvg />
					</a>
				</div>
				<div className={css.socialItem}>
					<a
						href={RoutePath.FAQ}
						onClick={e => {
							analytics.mainviewFaqClick();
							e.preventDefault();
							navigate(RoutePath.FAQ);
						}}
					>
						FAQ
					</a>
				</div>
			</div>
		</div>
	);
});

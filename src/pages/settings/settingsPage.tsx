import { observer } from 'mobx-react';
import { ReactNode } from 'react';
import { generatePath, Navigate, useParams } from 'react-router-dom';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../components/ActionButton/ActionButton';
import { NarrowContent } from '../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout } from '../../components/genericLayout/genericLayout';
import domain from '../../stores/Domain';
import { RoutePath } from '../../stores/routePath';
import { assertUnreachable, invariant } from '../../utils/assert';
import { truncateAddress } from '../../utils/string';
import { useNav } from '../../utils/url';
import { FeedSourcesSection } from './feedSourcesSection/feedSourcesSection';
import { PaymentsSection } from './paymentsSection/paymentsSection';
import css from './settingsPage.module.scss';

export enum SettingsSection {
	SOURCES = 'sources',
	PAYMENTS = 'payments',
}

export const SettingsPage = observer(() => {
	const navigate = useNav();
	const { address: currentAddress, section: currentSection } = useParams<{
		address: string;
		section?: SettingsSection;
	}>();
	invariant(currentAddress);

	const currentAccount = domain.accounts.activeAccounts.find(a => a.account.address === currentAddress);
	invariant(currentAccount);

	function renderTab(section: SettingsSection, name: ReactNode) {
		const isActive = section === currentSection;
		const look = isActive ? ActionButtonLook.HEAVY : ActionButtonLook.DEFAULT;

		return (
			<ActionButton
				size={ActionButtonSize.MEDIUM}
				look={look}
				onClick={() =>
					isActive ||
					navigate(generatePath(RoutePath.SETTINGS_ADDRESS_SECTION, { address: currentAddress!, section }), {
						replace: true,
					})
				}
			>
				{name}
			</ActionButton>
		);
	}

	return currentSection ? (
		<GenericLayout>
			<NarrowContent contentClassName={css.root} title={`Settings for ${truncateAddress(currentAddress)}`}>
				<div className={css.tabs}>
					{renderTab(SettingsSection.SOURCES, 'Sources')}
					{renderTab(SettingsSection.PAYMENTS, 'Payments')}
				</div>

				<div className={css.content}>
					{currentSection === SettingsSection.SOURCES ? (
						<FeedSourcesSection account={currentAccount} />
					) : currentSection === SettingsSection.PAYMENTS ? (
						<PaymentsSection account={currentAccount} />
					) : (
						assertUnreachable(currentSection)
					)}
				</div>
			</NarrowContent>
		</GenericLayout>
	) : (
		<Navigate
			replace
			to={generatePath(RoutePath.SETTINGS_ADDRESS_SECTION, {
				address: currentAddress,
				section: SettingsSection.SOURCES,
			})}
		/>
	);
});

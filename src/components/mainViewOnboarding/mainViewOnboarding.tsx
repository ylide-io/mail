import { observer } from 'mobx-react';
import { useEffect } from 'react';

import { MainviewApi } from '../../api/mainviewApi';
import { analytics } from '../../stores/Analytics';
import { browserStorage } from '../../stores/browserStorage';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { useLatest } from '../../utils/useLatest';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { LoadingModal } from '../loadingModal/loadingModal';

import css from './mainViewOnboarding.module.scss';
import { useOnMountAnimation } from '../../utils/useOnMountAnimation';
import { CoverageBlock, CoveragePlate } from '../feedSettingsModal/addWalletSourceModal';
import { FeedSettings } from '../../stores/FeedSettings';
import { FeedLinkTypeIcon } from '../../pages/feed/_common/feedLinkTypeIcon/feedLinkTypeIcon';
import clsx from 'clsx';
import { LinkType } from '../../api/feedServerApi';
import { PortfolioScope } from '../../shared/PortfolioScope';

// <IosInstallPwaPopup />

export interface AuthorizeAccountFlowProps {
	address: string;
	onClose: (result?: { account: DomainAccount; initing: boolean }) => void;
}

export const AuthorizeAccountFlow = observer(({ address, onClose }: AuthorizeAccountFlowProps) => {
	const onCloseRef = useLatest(onClose);

	useEffect(() => {
		(async () => {
			try {
				const timestamp = Math.floor(Date.now() / 1000);
				analytics.mainviewOnboardingEvent('request-signature');

				let signature;
				try {
					signature = await domain._signMessageAsync({
						message: `Mainview auth for address ${address}, timestamp: ${timestamp}`,
					});
				} catch (e) {
					analytics.mainviewOnboardingEvent('signature-reject');
					throw e;
				}

				const accData = await MainviewApi.auth.authBySignature(
					domain.session,
					{ address, timestamp, signature },
					browserStorage.referrer,
				);

				analytics.mainviewOnboardingEvent('account-authorized');
				onCloseRef.current({
					account: new DomainAccount(
						accData.id,
						accData.address,
						accData.email,
						accData.defaultFeedId,
						accData.plan,
						accData.planEndsAt,
						accData.inited,
					),
					initing: accData.initing,
				});
			} catch (e) {
				analytics.mainviewOnboardingEvent('authorization-error');
				onCloseRef.current();
			}
		})();
	}, [address, onCloseRef]);

	return <LoadingModal reason="Authorization ..." />;
});

export const BuildFeedFlow = observer(() => {
	return (
		<>
			<ActionModal
				title="We're setting up your personalized feed"
				buttons={<ActionButton isLoading size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY} />}
			>
				We're currently fetching data about your tokens and transactions to create a tailored experience just
				for you. This may take a few moments. Thank you for your patience.
			</ActionModal>
		</>
	);
});

export const PortfolioTable = observer(({ feed }: { feed: FeedSettings }) => {
	const max = 6;
	const sort = PortfolioScope.projectsSort(feed.portfolio, domain.feedSources);
	const sortedProjects = [...feed.activeProjectIds].sort(sort);
	const projects = sortedProjects.slice(0, max);
	const isMore = feed.activeProjectIds.length > max;
	const more = feed.activeProjectIds.length - max;

	return (
		<table className={css.portfolioTable}>
			<thead>
				<tr>
					<th className={clsx(css.portfolioCol, css.headCol)}>
						<h2>We took your crypto exposure</h2>
						<h4>out of 10,500 projects that Mainview analyses</h4>
					</th>
					<th className={clsx(css.sourcesCol, css.headCol)}>
						<h2>Mapped projects to news sources</h2>
						<h4>out of 4,700 sources we parse every second</h4>
					</th>
				</tr>
			</thead>
			<tbody>
				{projects.map((projectId, i) => {
					const sources = domain.feedSources.sourcesByProjectId.get(projectId);
					return (
						<tr key={projectId} className={i % 2 === 0 ? css.even : css.odd}>
							<td className={clsx(css.portfolioCol, css.bodyCol)}>
								<CoveragePlate
									id={projectId}
									meta={feed.portfolio.projectToPortfolioMetaMap[projectId]}
									project={domain.feedSources.projectsMap.get(projectId)}
									embedded
								/>
							</td>
							<td className={clsx(css.sourcesCol, css.bodyCol)}>
								{sources?.map(source => {
									return (
										<div key={source.id} className={css.sourceItem}>
											<FeedLinkTypeIcon
												className={css.sourceLogo}
												size={18}
												linkType={source.type}
											/>
											{source?.name}
											{(() => {
												const w = (v: string) => (
													<div className={css.sourceLink}>
														(
														<a href={source.link} target="_blank" rel="noreferrer">
															{v}
														</a>
														)
													</div>
												);
												if (source.type === LinkType.TWITTER) {
													return w('@' + source.origin || '');
												} else if (source.type === LinkType.TELEGRAM) {
													return w('@' + source.origin || '');
												} else if (source.type === LinkType.MIRROR) {
													return w(
														source.link
															.replace('https://', '')
															.replace('http://', '')
															.replace(/\.mirror\.xyz\/$/, '.mirror.xyz'),
													);
												} else if (source.type === LinkType.DISCORD) {
													const md =
														sources.filter(s => s.type === LinkType.DISCORD).length > 1;
													if (md) {
														return w('link');
													} else {
														return w(source.origin || 'link');
													}
												}
												return null;
											})()}
										</div>
									);
								})}
							</td>
						</tr>
					);
				})}
				{isMore && (
					<tr>
						<td className={css.thereIsMore} colSpan={2}>
							There {more === 1 ? 'is one' : `are ${more}`} more {more === 1 ? 'project' : 'projects'} in
							your portfolio, that were parsed and analysed too. You can see full list of your projects
							and news sources in your feed settings.
						</td>
					</tr>
				)}
			</tbody>
		</table>
	);
});

export const OnboardingFlow = observer(() => {
	const isIniting = domain.account && !domain.account.inited;
	const isInited = domain.account && domain.account.inited;

	const isOnboarded = browserStorage.isOnboarded;
	const isMounted = useOnMountAnimation();

	const defaultFeed = domain.account?.defaultFeedId
		? domain.feedsRepository.feedSettingsById.get(domain.account.defaultFeedId)
		: null;

	if (!isMounted) {
		return null;
	}

	return (
		<>
			{isIniting && <BuildFeedFlow />}

			{isInited && !isOnboarded && defaultFeed && (
				<ActionModal
					className={css.onboardingModal}
					buttons={
						<ActionButton
							size={ActionButtonSize.XLARGE}
							look={ActionButtonLook.PRIMARY}
							onClick={() => {
								browserStorage.isOnboarded = true;
							}}
						>
							Show it
						</ActionButton>
					}
				>
					{defaultFeed && <PortfolioTable feed={defaultFeed} />}
					<div className={css.onboardingFooter}>
						<h2>And made a perfect news feed tailored right for you</h2>
						<h4>Because your portfolio matters: don't miss any news that affects asset prices</h4>
					</div>
				</ActionModal>
			)}
		</>
	);
});

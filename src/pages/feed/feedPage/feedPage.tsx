import { observer } from 'mobx-react';
import React, { useEffect, useMemo, useRef } from 'react';
import { generatePath, useParams } from 'react-router-dom';

import { FeedCategory, FeedServerApi } from '../../../api/feedServerApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButton/ActionButton';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout, useGenericLayoutApi } from '../../../components/genericLayout/genericLayout';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { ReactComponent as ArrowUpSvg } from '../../../icons/ic20/arrowUp.svg';
import { ReactComponent as CrossSvg } from '../../../icons/ic20/cross.svg';
import { useDomainAccounts } from '../../../stores/Domain';
import { FeedStore, getFeedCategoryName } from '../../../stores/Feed';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { useNav } from '../../../utils/url';
import { FeedPostItem } from '../components/feedPostItem/feedPostItem';
import css from './feedPage.module.scss';
import ErrorCode = FeedServerApi.ErrorCode;

function isInViewport(element: Element) {
	const rect = element.getBoundingClientRect();
	return rect.top >= -100 && rect.top <= (window.innerHeight || document.documentElement.clientHeight);
}

const FeedPageContent = observer(() => {
	const navigate = useNav();
	const genericLayoutApi = useGenericLayoutApi();

	const lastPostView = useRef<HTMLDivElement>(null);
	const feedBodyRef = useRef<HTMLDivElement>(null);
	const { category, source, address } = useParams<{ category: FeedCategory; source: string; address: string }>();

	const accounts = useDomainAccounts();
	const selectedAccount = accounts.find(a => a.account.address === address);

	useEffect(() => {
		if (address && !selectedAccount) {
			navigate(generatePath(RoutePath.FEED));
		}
	}, [address, navigate, selectedAccount]);

	// TODO Reload when feed settings changes

	const feed = useMemo(() => {
		const feed = new FeedStore({
			category,
			sourceId: source,
			addressTokens: selectedAccount
				? [selectedAccount.mainViewKey]
				: !category && !source
				? accounts.map(a => a.mainViewKey)
				: undefined,
		});

		genericLayoutApi.scrollToTop();

		if (!!accounts.length && accounts.every(a => a.mainViewKey)) {
			feed.load();
		}

		return feed;
	}, [accounts, category, genericLayoutApi, selectedAccount, source]);

	useEffect(() => {
		const timer = setInterval(async () => {
			if (lastPostView.current && isInViewport(lastPostView.current) && feed.moreAvailable) {
				await feed.loadMore();
			}
		}, 300);

		return () => clearInterval(timer);
	}, [feed]);

	return (
		<NarrowContent
			title={getFeedCategoryName(feed.category || FeedCategory.MAIN)}
			titleSubItem={
				!!source && (
					<ActionButton
						look={ActionButtonLook.PRIMARY}
						icon={<CrossSvg />}
						onClick={() => navigate({ search: {} })}
					>
						Clear filter
					</ActionButton>
				)
			}
			titleRight={
				!!feed.newPosts && (
					<ActionButton look={ActionButtonLook.SECONDARY} onClick={() => feed.loadNew()}>
						Show {feed.newPosts} new posts
					</ActionButton>
				)
			}
		>
			{!!feed.posts.length && (
				<ActionButton
					className={css.scrollToTop}
					size={ActionButtonSize.XLARGE}
					look={ActionButtonLook.SECONDARY}
					icon={<ArrowUpSvg />}
					onClick={() => genericLayoutApi.scrollToTop()}
				/>
			)}

			<div className={css.feedBody} ref={feedBodyRef}>
				{feed.loaded ? (
					<>
						{feed.posts.map(post => (
							<FeedPostItem isInFeed post={post} key={post.id} />
						))}

						{feed.moreAvailable && (
							<div className={css.loader} ref={lastPostView}>
								<YlideLoader reason="Loading more posts ..." />
							</div>
						)}
					</>
				) : feed.error ? (
					<ErrorMessage
						look={feed.error === ErrorCode.NO_POSTS_FOR_ADDRESS ? ErrorMessageLook.INFO : undefined}
					>
						{feed.error === ErrorCode.NO_POSTS_FOR_ADDRESS ? (
							<>
								<b>No posts for this account.</b>
								<div>
									Your crypto account doesn't have any tokens or transactions that we can use to build
									the Feed for you. You can connect another account anytime.
								</div>
								<ActionButton look={ActionButtonLook.PRIMARY} onClick={() => connectAccount()}>
									Connect another account
								</ActionButton>
							</>
						) : (
							'Sorry, an error occured during feed loading. Please, try again later.'
						)}
					</ErrorMessage>
				) : (
					feed.loading && (
						<div className={css.loader}>
							<YlideLoader reason="Your feed is loading ..." />
						</div>
					)
				)}
			</div>
		</NarrowContent>
	);
});

export const FeedPage = () => (
	<GenericLayout>
		<FeedPageContent />
	</GenericLayout>
);

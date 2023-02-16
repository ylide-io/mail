import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { ActionButton, ActionButtonStyle } from '../../components/ActionButton/ActionButton';
import { ErrorMessage } from '../../components/errorMessage/errorMessage';
import { FeedLayout } from '../../components/feedLayout/feedLayout';
import { FeedPostItem } from '../../components/feedPostItem/feedPostItem';
import { YlideLoader } from '../../components/ylideLoader/ylideLoader';
import { YlideButton } from '../../controls/YlideButton';
import { CaretDown } from '../../icons/CaretDown';
import { ReactComponent as CrossSvg } from '../../icons/cross.svg';
import { browserStorage } from '../../stores/browserStorage';
import feed, { FeedCategory } from '../../stores/Feed';
import { useNav } from '../../utils/navigate';
import { scrollWindowToTop } from '../../utils/ui';
import css from './FeedPage.module.scss';

function isInViewport(element: HTMLDivElement) {
	const rect = element.getBoundingClientRect();
	return rect.top >= -100 && rect.top <= (window.innerHeight || document.documentElement.clientHeight);
}

export const FeedPage = observer(() => {
	const navigate = useNav();
	const lastPostView = useRef<HTMLDivElement>(null);
	const feedBodyRef = useRef<HTMLDivElement>(null);
	const [newPostsVisible, setNewPostsVisible] = useState(false);
	const { category } = useParams<{ category: FeedCategory }>();
	const { search } = useLocation();
	const searchParams = search.length > 1 ? new URLSearchParams(search.slice(1)) : undefined;
	const sourceId = searchParams?.get('sourceId') || undefined;

	const sourceListId = browserStorage.feedSourceSettings?.listId;
	const [lastSourceListId, setLastSourceListId] = useState(sourceListId);

	// Re-load when category changes
	useEffect(() => {
		scrollWindowToTop();
		feed.loadCategory(category!, sourceId).then();
	}, [category, sourceId]);

	// Re-load when source-list changes
	useEffect(() => {
		if (lastSourceListId !== sourceListId) {
			setLastSourceListId(sourceListId);

			if (category === FeedCategory.MAIN) {
				scrollWindowToTop();
				feed.loadCategory(category, sourceId).then();
			}
		}
	}, [category, lastSourceListId, sourceId, sourceListId]);

	useEffect(() => {
		const timer = setInterval(async () => {
			if (lastPostView.current && isInViewport(lastPostView.current) && !feed.loading && feed.moreAvailable) {
				await feed.loadMore(10);
			}

			if (feedBodyRef.current && feedBodyRef.current.getBoundingClientRect().top < 0) {
				setNewPostsVisible(true);
			} else {
				setNewPostsVisible(false);
			}
		}, 300);

		return () => clearInterval(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [feed.loading, feed.moreAvailable]);

	const showNewPosts = async () => {
		scrollWindowToTop();
		await feed.loadNew();
	};

	let title;

	if (feed.selectedCategory === FeedCategory.MAIN) {
		title = 'My feed';
	} else if (feed.selectedCategory === FeedCategory.ALL) {
		title = 'All topics';
	} else {
		title = feed.selectedCategory;
	}

	return (
		<FeedLayout
			title={title}
			titleSubItem={
				!!sourceId && (
					<ActionButton
						style={ActionButtonStyle.Primary}
						icon={<CrossSvg />}
						onClick={() => navigate({ search: {} })}
					>
						Clear filter
					</ActionButton>
				)
			}
			titleRight={
				!!feed.newPosts && (
					<YlideButton size="small" nice onClick={showNewPosts}>
						Show {feed.newPosts} new posts
					</YlideButton>
				)
			}
		>
			{newPostsVisible && (
				<div className={css.scrollToTop} onClick={() => scrollWindowToTop()}>
					<CaretDown color="black" style={{ width: 40, height: 40 }} />
				</div>
			)}

			<div className={css.feedBody} ref={feedBodyRef}>
				{newPostsVisible && !!feed.newPosts && (
					<div className={css.newPosts}>
						<YlideButton className={css.feedNewPostsButton} size="small" nice onClick={showNewPosts}>
							Show {feed.newPosts} new posts
						</YlideButton>
					</div>
				)}

				{feed.loaded ? (
					<>
						{feed.posts.map(post => (
							<FeedPostItem isInFeed post={post} key={post.id} />
						))}

						{feed.moreAvailable && (
							<div className={css.loader} ref={lastPostView}>
								{feed.loading && <YlideLoader reason="Loading more posts ..." />}
							</div>
						)}
					</>
				) : feed.errorLoading ? (
					<ErrorMessage>Sorry, an error occured during feed loading. Please, try again later.</ErrorMessage>
				) : (
					<div className={css.loader}>
						<YlideLoader reason="Your feed is loading ..." />
					</div>
				)}
			</div>
		</FeedLayout>
	);
});

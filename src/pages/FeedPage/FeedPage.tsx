import { UserOutlined } from '@ant-design/icons';
import Avatar from 'antd/lib/avatar/avatar';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { ActionButton, ActionButtonStyle } from '../../components/ActionButton/ActionButton';
import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { ReadableDate } from '../../components/readableDate/readableDate';
import { smallButtonIcons } from '../../components/smallButton/smallButton';
import { YlideLoader } from '../../components/ylideLoader/ylideLoader';
import { YlideButton } from '../../controls/YlideButton';
import { CaretDown } from '../../icons/CaretDown';
import { discordSourceIcon } from '../../icons/static/discordSourceIcon';
import { linkIcon } from '../../icons/static/linkIcon';
import { mirrorSourceIcon } from '../../icons/static/mirrorSourceIcon';
import { telegramSourceIcon } from '../../icons/static/telegramSourceIcon';
import { twitterSourceIcon } from '../../icons/static/twitterSourceIcon';
import GalleryModal from '../../modals/GalleryModal';
import feed, { FeedCategory, FeedPost, LinkType } from '../../stores/Feed';
import { useNav } from '../../utils/navigate';
import css from './FeedPage.module.scss';

const sourceIcon: Record<LinkType, JSX.Element> = {
	[LinkType.TWITTER]: twitterSourceIcon,
	[LinkType.MIRROR]: mirrorSourceIcon,
	[LinkType.DISCORD]: discordSourceIcon,
	[LinkType.TELEGRAM]: telegramSourceIcon,
	[LinkType.MEDIUM]: <></>,
};

function isInViewport(element: HTMLDivElement) {
	const rect = element.getBoundingClientRect();
	return rect.top >= -100 && rect.top <= (window.innerHeight || document.documentElement.clientHeight);
}

const FeedPostControl = observer(({ post }: { post: FeedPost }) => {
	const selfRef = useRef<HTMLDivElement>(null);
	const [collapsed, setCollapsed] = useState(false);
	const navigate = useNav();

	useEffect(() => {
		if (selfRef.current && selfRef.current.getBoundingClientRect().height > 600) {
			setCollapsed(true);
		}
	}, []);

	const onPostTextClick = (e: MouseEvent) => {
		if ((e.target as Element).tagName.toUpperCase() === 'IMG') {
			GalleryModal.view([(e.target as HTMLImageElement).src]);
		}
	};

	const onSourceIdClick = () => {
		navigate({
			search: { sourceId: post.sourceId },
		});
	};

	return (
		<div ref={selfRef} className={clsx(css.post, { [css.post_collapsed]: collapsed })}>
			<div className={css.postAva}>
				<Avatar size={48} src={post.authorAvatar} icon={<UserOutlined />} />
				<div className={css.postAvaSource}>{sourceIcon[post.sourceType]}</div>
			</div>

			<div className={css.postMeta}>
				<div className={css.postSource} onClick={onSourceIdClick}>
					{!!post.authorName && <div>{post.authorName}</div>}
					{!!post.authorNickname && <div className={css.postSourceUser}>{post.authorNickname}</div>}
					{!!post.sourceName && (
						<>
							<div>in</div>
							<div className={css.postSourceName}>
								<div>{discordSourceIcon}</div>
								<div>{post.sourceName}</div>
							</div>
						</>
					)}
				</div>
				<ReadableDate className={css.postDate} value={Date.parse(post.date)} />
				{!!post.sourceLink && (
					<a className={css.postExternalButton} href={post.sourceLink} target="_blank" rel="noreferrer">
						{linkIcon}
					</a>
				)}
			</div>

			<div className={css.postContent}>
				{!!post.title && <div className={css.postTitle}>{post.title}</div>}

				{!!post.subtitle && <div className={css.postSubtitle}>{post.subtitle}</div>}

				<div
					className={css.postText}
					dangerouslySetInnerHTML={{ __html: post.content }}
					onClick={onPostTextClick}
				/>

				{!!post.picrel &&
					post.sourceType !== LinkType.MIRROR &&
					(post.picrel.endsWith('.mp4') ? (
						<video loop className={css.postPicture} controls>
							<source src={post.picrel} type="video/mp4" />
						</video>
					) : (
						<div
							style={{ backgroundImage: `url("${post.picrel}")` }}
							className={css.postPicture}
							onClick={() => {
								GalleryModal.view([post.picrel]);
							}}
						/>
					))}

				{!!post.embeds.length && (
					<div className={css.postEmbeds}>
						{post.embeds.map((e, idx) => (
							<a
								key={idx}
								className={clsx(css.postEmbed, {
									[css.postEmbed_withLink]: !!e.link,
								})}
								href={e.link}
								target="_blank"
								rel="noreferrer"
							>
								{!!e.previewImageUrl && (
									<div
										className={css.postEmbedImage}
										style={{
											backgroundImage: `url("${e.previewImageUrl}")`,
										}}
									/>
								)}

								{!!e.link && (
									<div className={css.postEmbedLink}>
										{e.link.length > 60 ? `${e.link.substring(0, 60)}...` : e.link}
									</div>
								)}
								{e.title ? <div className={css.postEmbedTitle}>{e.title}</div> : null}

								{!!e.text && (
									<div className={css.postEmbedText} dangerouslySetInnerHTML={{ __html: e.text }} />
								)}
							</a>
						))}
					</div>
				)}
			</div>

			{collapsed && (
				<button className={css.postReadMore} onClick={() => setCollapsed(false)}>
					Read more
				</button>
			)}
		</div>
	);
});

export const FeedPage = observer(() => {
	const lastPostView = useRef<HTMLDivElement>(null);
	const feedBodyRef = useRef<HTMLDivElement>(null);
	const [newPostsVisible, setNewPostsVisible] = useState(false);
	const { category } = useParams();
	const { search } = useLocation();
	const searchParams = search.length > 1 ? new URLSearchParams(search.slice(1)) : undefined;
	const sourceId = searchParams?.get('sourceId') || null;
	const navigate = useNav();

	const scrollToTop = useCallback(() => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	}, []);

	useEffect(() => {
		scrollToTop();

		// noinspection JSIgnoredPromiseFromCall
		feed.loadCategory(category!, sourceId);
	}, [category, scrollToTop, sourceId]);

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

	const showNewPosts = useCallback(() => {
		scrollToTop();

		// noinspection JSIgnoredPromiseFromCall
		feed.loadNew();
	}, [scrollToTop]);

	let title;

	if (feed.selectedCategory === FeedCategory.MAIN) {
		title = 'My feed';
	} else if (feed.selectedCategory === FeedCategory.ALL) {
		title = 'All topics';
	} else {
		title = feed.selectedCategory;
	}

	return (
		<GenericLayout isCustomContent>
			<div className={css.root}>
				<div className={css.feed}>
					<div className={css.feedTitle}>
						<div className={css.feedTitleLeft}>
							<h3 className={css.feedTitleText}>{title}</h3>

							{!!sourceId && (
								<ActionButton
									style={ActionButtonStyle.Primary}
									icon={<i className={`fa ${smallButtonIcons.cross}`} />}
									onClick={() => navigate({ search: {} })}
								>
									Clear filter
								</ActionButton>
							)}
						</div>

						{!!feed.newPosts && (
							<YlideButton size="small" nice onClick={showNewPosts}>
								Show {feed.newPosts} new posts
							</YlideButton>
						)}
					</div>

					{newPostsVisible && (
						<div className={css.feedScrollToTop} onClick={scrollToTop}>
							<CaretDown color="black" style={{ width: 40, height: 40 }} />
						</div>
					)}

					<div className={css.feedBody} ref={feedBodyRef}>
						{newPostsVisible && !!feed.newPosts && (
							<div className={css.feedNewPosts}>
								<YlideButton
									className={css.feedNewPostsButton}
									size="small"
									nice
									onClick={showNewPosts}
								>
									Show {feed.newPosts} new posts
								</YlideButton>
							</div>
						)}

						{feed.loaded ? (
							<>
								{feed.posts.map(post => {
									return <FeedPostControl post={post} key={post.id} />;
								})}

								{feed.moreAvailable && (
									<div className={css.feedLastPost} ref={lastPostView}>
										{feed.loading && <YlideLoader reason="Loading more posts..." />}
									</div>
								)}
							</>
						) : (
							<div style={{ marginTop: 30 }}>
								<YlideLoader reason="Your feed is loading..." />
							</div>
						)}

						{feed.errorLoading && `Sorry, an error occured during feed loading. Please, try again later.`}
					</div>
				</div>
			</div>
		</GenericLayout>
	);
});

import React, { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import GenericLayout from '../../layouts/GenericLayout';

import { YlideButton } from '../../controls/YlideButton';
import feed, { FeedPost, LinkType } from '../../stores/Feed';
import moment from 'moment';
import Avatar from 'antd/lib/avatar/avatar';
import { UserOutlined } from '@ant-design/icons';
import { discordSourceIcon } from '../../icons/static/discordSourceIcon';
import { twitterSourceIcon } from '../../icons/static/twitterSourceIcon';
import { mirrorSourceIcon } from '../../icons/static/mirrorSourceIcon';
import { telegramSourceIcon } from '../../icons/static/telegramSourceIcon';
import { linkIcon } from '../../icons/static/linkIcon';
import GalleryModal from '../../modals/GalleryModal';
import { Loader } from '../../controls/Loader';
import { observer } from 'mobx-react';
import { useParams } from 'react-router-dom';
import { CaretDown } from '../../icons/CaretDown';
import clsx from 'clsx';
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

	return (
		<div ref={selfRef} className={clsx(css.post, { [css.post_collapsed]: collapsed })}>
			<div className={css.postAva}>
				<Avatar size={48} src={post.authorAvatar} icon={<UserOutlined />} />
				<div className={css.postAvaSource}>{sourceIcon[post.sourceType]}</div>
			</div>

			<div className={css.postMeta}>
				<div className={css.postSource}>
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
				<div className={css.postDate}>{moment.utc(post.date).local().format('MMM D, YYYY, HH:mm')}</div>
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

	useEffect(() => {
		// noinspection JSIgnoredPromiseFromCall
		feed.loadCategory(category!);
	}, [category]);

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

	const scrollToTop = useCallback(() => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	}, []);

	const showNewPosts = useCallback(() => {
		// noinspection JSIgnoredPromiseFromCall
		feed.loadNew();

		scrollToTop();
	}, [scrollToTop]);

	let title;

	if (feed.selectedCategory === 'main') {
		title = 'My feed';
	} else if (feed.selectedCategory === 'all') {
		title = 'All topics';
	} else {
		title = feed.selectedCategory;
	}

	return (
		<GenericLayout mainClass={css.feedContainer}>
			<div className={css.feed}>
				<div className={css.feedTitle}>
					<h3 className={css.feedTitleText}>{title}</h3>
					<h3>
						{!!feed.newPosts && (
							<YlideButton size="small" nice onClick={showNewPosts}>
								Show {feed.newPosts} new posts
							</YlideButton>
						)}
					</h3>
				</div>

				{newPostsVisible && (
					<div className={css.feedScrollToTop} onClick={scrollToTop}>
						<CaretDown color="black" style={{ width: 40, height: 40 }} />
					</div>
				)}

				<div className={css.feedBody} ref={feedBodyRef}>
					{newPostsVisible && !!feed.newPosts && (
						<div className={css.feedNewPosts}>
							<YlideButton className={css.feedNewPostsButton} size="small" nice onClick={showNewPosts}>
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
									{feed.loading && <Loader reason="Loading more posts..." />}
								</div>
							)}
						</>
					) : (
						<div style={{ marginTop: 30 }}>
							<Loader reason="Your feed is loading..." />
						</div>
					)}

					{feed.errorLoading && `Sorry, an error occured during feed loading. Please, try again later.`}
				</div>
			</div>
		</GenericLayout>
	);
});

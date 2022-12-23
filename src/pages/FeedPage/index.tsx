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
import { useWindowSize } from '../../utils/useWindowSize';
import clsx from 'clsx';

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
	const { windowWidth } = useWindowSize();
	const [collapsed, setCollapsed] = useState(false);

	useEffect(() => {
		if (selfRef.current) {
			if (selfRef.current.getBoundingClientRect().height > 600) {
				setCollapsed(true);
			}
		}
	}, []);

	const readMore = useCallback(() => {
		setCollapsed(false);
	}, []);

	const onPostTextClick = (e: MouseEvent) => {
		if ((e.target as Element).tagName.toUpperCase() === 'IMG') {
			GalleryModal.view([(e.target as HTMLImageElement).src]);
		}
	};

	const renderPostContent = () => {
		return (
			<div className="post-content">
				{post.title ? <div className="post-title">{post.title}</div> : null}
				{post.subtitle ? <div className="post-subtitle">{post.subtitle}</div> : null}
				<div
					className="post-text"
					dangerouslySetInnerHTML={{ __html: post.content }}
					onClick={onPostTextClick}
				/>
				{post.picrel && post.sourceType !== LinkType.MIRROR ? (
					post.picrel.endsWith('.mp4') ? (
						<video loop className="post-picrel" controls>
							<source src={post.picrel} type="video/mp4" />
						</video>
					) : (
						<div
							style={{ backgroundImage: `url("${post.picrel}")` }}
							className="post-picrel"
							onClick={() => {
								GalleryModal.view([post.picrel]);
							}}
						/>
					)
				) : null}
				{post.embeds.length ? (
					<div className="post-embeds">
						{post.embeds.map((e, idx) => (
							<a
								target="_blank"
								rel="noreferrer"
								href={e.link || ''}
								key={idx}
								className={clsx('post-embed', {
									'with-link': !!e.link,
								})}
							>
								{e.previewImageUrl ? (
									<div
										className="post-embed-image"
										style={{
											backgroundImage: `url("${e.previewImageUrl}")`,
										}}
									/>
								) : null}
								{e.link ? (
									<div className="post-embed-link">
										{e.link.length > 60 ? `${e.link.substring(0, 60)}...` : e.link}
									</div>
								) : null}
								{e.title ? <div className="post-embed-title">{e.title}</div> : null}
								{e.text ? (
									<div className="post-embed-text" dangerouslySetInnerHTML={{ __html: e.text }} />
								) : null}
							</a>
						))}
					</div>
				) : null}
			</div>
		);
	};

	if (windowWidth <= 670) {
		return (
			<div className={clsx('post-mobile', { collapsed })} ref={selfRef}>
				<div className="post-header">
					<div className="post-ava">
						<div className="post-ava-image">
							<Avatar size={48} src={post.authorAvatar} icon={<UserOutlined />} />
							<div className="post-ava-source">{sourceIcon[post.sourceType]}</div>
						</div>
					</div>
					<div className="post-meta">
						<div className="post-source-left">
							{post.authorName ? <div className="post-source-name">{post.authorName}</div> : null}
							{post.authorNickname ? (
								<div className="post-source-username">{post.authorNickname}</div>
							) : null}
							{post.sourceName ? (
								<>
									<div className="post-source-in">in</div>
									<div className="post-source-data">
										<div className="post-source-channel-icon">{discordSourceIcon}</div>
										<div className="post-source-channel-name">{post.sourceName}</div>
									</div>
								</>
							) : null}
						</div>
						<div className="post-source-right">
							<div className="post-source-date">
								{moment.utc(post.date).local().format('MMM D, YYYY, HH:mm')}
							</div>
						</div>
					</div>
					{post.sourceLink ? (
						<a className="post-source-link" href={post.sourceLink} target="_blank" rel="noreferrer">
							{linkIcon}
						</a>
					) : null}
				</div>
				{renderPostContent()}
				<div className="post-collapser" onClick={readMore}>
					<span className="rm-expander">Read more</span>
				</div>
			</div>
		);
	} else {
		return (
			<div className={clsx('post-desktop', { collapsed })} ref={selfRef}>
				<div className="post-ava">
					<div className="post-ava-image">
						<Avatar size={48} src={post.authorAvatar} icon={<UserOutlined />} />
						<div className="post-ava-source">{sourceIcon[post.sourceType]}</div>
					</div>
				</div>
				<div className="post-body">
					<div className="post-meta">
						<div className="post-source-left">
							{post.authorName ? <div className="post-source-name">{post.authorName}</div> : null}
							{post.authorNickname ? (
								<div className="post-source-username">{post.authorNickname}</div>
							) : null}
							{post.sourceName ? (
								<>
									<div className="post-source-in">in</div>
									<div className="post-source-data">
										<div className="post-source-channel-icon">{discordSourceIcon}</div>
										<div className="post-source-channel-name">{post.sourceName}</div>
									</div>
								</>
							) : null}
						</div>
						<div className="post-source-right">
							<div className="post-source-date">
								{moment.utc(post.date).local().format('MMM D, YYYY, HH:mm')}
							</div>
							{post.sourceLink ? (
								<a className="post-source-link" href={post.sourceLink} target="_blank" rel="noreferrer">
									{linkIcon}
								</a>
							) : null}
						</div>
					</div>
					{renderPostContent()}
				</div>
				<div className="post-collapser" onClick={readMore}>
					<span className="rm-expander">Read more</span>
				</div>
			</div>
		);
	}
});

const FeedPage = observer(() => {
	const lastPostView = useRef<HTMLDivElement>(null);
	const feedBodyRef = useRef<HTMLDivElement>(null);
	const [newPostsVisible, setNewPostsVisible] = useState(false);
	const { category } = useParams();

	useEffect(() => {
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
		return () => {
			clearInterval(timer);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [feed.loading, feed.moreAvailable]);

	const scrollToTop = useCallback(() => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	}, []);

	const showNewPosts = useCallback(async () => {
		scrollToTop();
		feed.loadNew();
	}, [scrollToTop]);

	let title = 'My feed';

	if (feed.selectedCategory === 'main') {
		title = 'My feed';
	} else if (feed.selectedCategory === 'all') {
		title = 'All topics';
	} else {
		title = feed.selectedCategory;
	}

	return (
		<GenericLayout mainClass="feed-container">
			<div className="feed">
				<div className="feed-title">
					<h3 className="feed-title-text">{title}</h3>
					<h3 className="feed-title-actions">
						{feed.newPosts ? (
							<YlideButton size="small" nice onClick={showNewPosts}>
								Show {feed.newPosts} new posts
							</YlideButton>
						) : null}
					</h3>
				</div>
				{newPostsVisible ? (
					<div className="feed-scroll-to-top" onClick={scrollToTop}>
						<CaretDown color="black" style={{ width: 40, height: 40 }} />
					</div>
				) : null}
				<div className="feed-body" ref={feedBodyRef}>
					{newPostsVisible && feed.newPosts ? (
						<div className="feed-new-posts">
							<YlideButton size="small" nice onClick={showNewPosts}>
								Show {feed.newPosts} new posts
							</YlideButton>
						</div>
					) : null}
					{feed.loaded ? (
						<>
							{feed.posts.map(post => {
								return <FeedPostControl post={post} key={post.id} />;
							})}
							{feed.moreAvailable ? (
								<div className="feed-last-post" ref={lastPostView}>
									{feed.loading ? <Loader reason="Loading more posts..." /> : null}
								</div>
							) : null}
						</>
					) : (
						<div style={{ marginTop: 30 }}>
							<Loader reason="Your feed is loading..." />
						</div>
					)}
					{feed.errorLoading ? `Sorry, an error occured during feed loading. Please, try again later.` : null}
				</div>
			</div>
		</GenericLayout>
	);
});

export default FeedPage;

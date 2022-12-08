import React, { useEffect, useRef } from 'react';
import GenericLayout from '../../layouts/GenericLayout';

import { YlideButton } from '../../controls/YlideButton';
import feed, { LinkType } from '../../stores/Feed';
import moment from 'moment';
import Avatar from 'antd/lib/avatar/avatar';
import { UserOutlined } from '@ant-design/icons';
import { discordSourceIcon } from '../../icons/static/discordSourceIcon';
import { twitterSourceIcon } from '../../icons/static/twitterSourceIcon';
import { mirrorSourceIcon } from '../../icons/static/mirrorSourceIcon';
import { telegramSourceIcon } from '../../icons/static/telegramSourceIcon';
import { linkIcon } from '../../icons/static/linkIcon';
import classNames from 'classnames';
import GalleryModal from '../../modals/GalleryModal';
import { Loader } from '../../controls/Loader';
import { observer } from 'mobx-react';
import { useParams } from 'react-router-dom';

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

const FeedPage = observer(() => {
	const lastPostView = useRef<HTMLDivElement>(null);
	const { category } = useParams();

	useEffect(() => {
		feed.loadCategory(category!);
	}, [category]);

	useEffect(() => {
		const timer = setInterval(async () => {
			if (lastPostView.current && isInViewport(lastPostView.current) && !feed.loading && feed.moreAvailable) {
				await feed.loadMore(10);
			}
		}, 500);
		return () => {
			clearInterval(timer);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [feed.loading, feed.moreAvailable]);

	return (
		<GenericLayout mainClass="feed-container">
			<div className="feed">
				<div className="feed-title">
					<h3 className="feed-title-text">My feed</h3>
					<h3 className="feed-title-actions">
						{feed.newPosts ? (
							<YlideButton size="small" nice>
								Show {feed.newPosts} new posts
							</YlideButton>
						) : null}
					</h3>
				</div>
				<div className="feed-body">
					{feed.loaded ? (
						<>
							{feed.posts.map(post => {
								return (
									<div className="post-desktop" key={post.id}>
										<div className="post-ava">
											<div className="post-ava-image">
												<Avatar size={48} src={post.authorAvatar} icon={<UserOutlined />} />
												{/* <img
											src={}
											alt="malt"
											style={{ width: 48, height: 48, borderRadius: '50%' }}
										/> */}
												<div className="post-ava-source">{sourceIcon[post.sourceType]}</div>
											</div>
										</div>
										<div className="post-content">
											<div className="post-meta">
												<div className="post-source-left">
													{post.authorName ? (
														<div className="post-source-name">{post.authorName}</div>
													) : null}
													{post.authorNickname ? (
														<div className="post-source-username">
															{post.authorNickname}
														</div>
													) : null}
													{post.sourceName ? (
														<>
															<div className="post-source-in">in</div>
															<div className="post-source-data">
																<div className="post-source-channel-icon">
																	{discordSourceIcon}
																</div>
																<div className="post-source-channel-name">
																	{post.sourceName}
																</div>
															</div>
														</>
													) : null}
												</div>
												<div className="post-source-right">
													<div className="post-source-date">
														{moment(post.date).format('MMM D, YYYY, HH:mm')}
													</div>
													{post.sourceLink ? (
														<a
															className="post-source-link"
															href={post.sourceLink}
															target="_blank"
															rel="noreferrer"
														>
															{linkIcon}
														</a>
													) : null}
												</div>
											</div>
											{post.title ? <div className="post-title">{post.title}</div> : null}
											{post.subtitle ? (
												<div className="post-subtitle">{post.subtitle}</div>
											) : null}
											{post.picrel ? (
												<div className="post-picrel">
													<div
														style={{ backgroundImage: `url("${post.picrel}")` }}
														className="post-picrel-image"
														onClick={() => {
															GalleryModal.view([post.picrel]);
														}}
													/>
												</div>
											) : null}
											<div
												className="post-text"
												dangerouslySetInnerHTML={{ __html: post.content }}
											></div>
											{post.embeds.length ? (
												<div className="post-embeds">
													{post.embeds.map((e, idx) => (
														<a
															target="_blank"
															rel="noreferrer"
															href={e.link || ''}
															key={idx}
															className={classNames('post-embed', {
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
																	{e.link.length > 60
																		? `${e.link.substring(0, 60)}...`
																		: e.link}
																</div>
															) : null}
															{e.title ? (
																<div className="post-embed-title">{e.title}</div>
															) : null}
															{e.text ? (
																<div
																	className="post-embed-text"
																	dangerouslySetInnerHTML={{ __html: e.text }}
																/>
															) : null}
														</a>
													))}
												</div>
											) : null}
										</div>
									</div>
								);
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

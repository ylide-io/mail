import Avatar from 'antd/lib/avatar/avatar';
import clsx from 'clsx';
import React, { MouseEvent, useEffect, useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { SharePopup } from '../../../../components/sharePopup/sharePopup';
import { ReactComponent as ContactSvg } from '../../../../icons/ic20/contact.svg';
import { ReactComponent as ExternalSvg } from '../../../../icons/ic20/external.svg';
import { ReactComponent as ShareSvg } from '../../../../icons/ic20/share.svg';
import { FeedCategory, FeedPost, LinkType } from '../../../../stores/Feed';
import { RoutePath } from '../../../../stores/routePath';
import { HorizontalAlignment } from '../../../../utils/alignment';
import { toAbsoluteUrl, useNav } from '../../../../utils/url';
import { FeedLinkTypeIcon } from '../feedLinkTypeIcon/feedLinkTypeIcon';
import css from './feedPostItem.module.scss';

interface FeedPostContentProps {
	post: FeedPost;
}

export function FeedPostContent({ post }: FeedPostContentProps) {
	const onPostTextClick = (e: MouseEvent) => {
		if ((e.target as Element).tagName.toUpperCase() === 'IMG') {
			GalleryModal.show([(e.target as HTMLImageElement).src]);
		}
	};

	return (
		<div className={css.content}>
			{!!post.title && <div className={css.title}>{post.title}</div>}

			{!!post.subtitle && <div className={css.subtitle}>{post.subtitle}</div>}

			<div className={css.text} dangerouslySetInnerHTML={{ __html: post.content }} onClick={onPostTextClick} />

			{!!post.picrel &&
				post.sourceType !== LinkType.MIRROR &&
				(post.picrel.endsWith('.mp4') ? (
					<video loop className={css.picture} controls>
						<source src={post.picrel} type="video/mp4" />
					</video>
				) : (
					<div
						style={{ backgroundImage: `url("${post.picrel}")` }}
						className={css.picture}
						onClick={() => GalleryModal.show([post.picrel])}
					/>
				))}

			{!!post.embeds.length && (
				<div className={css.embeds}>
					{post.embeds.map((e, idx) => (
						<a
							key={idx}
							className={clsx(css.embed, {
								[css.postEmbed_withLink]: !!e.link,
							})}
							href={e.link}
							target="_blank"
							rel="noreferrer"
						>
							{!!e.previewImageUrl && (
								<div
									className={css.embedImage}
									style={{
										backgroundImage: `url("${e.previewImageUrl}")`,
									}}
								/>
							)}

							{!!e.link && (
								<div className={css.embedLink}>
									{e.link.length > 60 ? `${e.link.substring(0, 60)}...` : e.link}
								</div>
							)}
							{e.title ? <div className={css.embedTitle}>{e.title}</div> : null}

							{!!e.text && <div className={css.embedText} dangerouslySetInnerHTML={{ __html: e.text }} />}
						</a>
					))}
				</div>
			)}
		</div>
	);
}

//

interface FeedPostItemProps {
	isInFeed?: boolean;
	post: FeedPost;
}

export function FeedPostItem({ isInFeed, post }: FeedPostItemProps) {
	const selfRef = useRef<HTMLDivElement>(null);
	const [collapsed, setCollapsed] = useState(false);
	const navigate = useNav();
	const postPath = generatePath(RoutePath.FEED_POST, { id: post.id });

	const shareButtonRef = useRef(null);
	const [isSharePopupOpen, setSharePopupOpen] = useState(false);

	useEffect(() => {
		if (isInFeed && selfRef.current && selfRef.current.getBoundingClientRect().height > 600) {
			setCollapsed(true);
		}
	}, [isInFeed]);

	const onSourceIdClick = () => {
		navigate({
			path: generatePath(RoutePath.FEED_CATEGORY, { category: FeedCategory.ALL }),
			search: { sourceId: post.sourceId },
		});
	};

	return (
		<div ref={selfRef} className={clsx(css.root, { [css.root_collapsed]: collapsed })}>
			<div className={css.ava}>
				<Avatar size={48} src={post.authorAvatar} icon={<ContactSvg width="100%" height="100%" />} />
				<FeedLinkTypeIcon className={css.avaSource} linkType={post.sourceType} />
			</div>

			<div className={css.meta}>
				<div className={css.source} onClick={onSourceIdClick}>
					{!!post.authorName && <div>{post.authorName}</div>}
					{!!post.authorNickname && <div className={css.sourceUser}>{post.authorNickname}</div>}
					{!!post.sourceName && (
						<>
							<div>in</div>
							<div className={css.sourceName}>
								<FeedLinkTypeIcon linkType={post.sourceType} size={16} />
								<div>{post.sourceName}</div>
							</div>
						</>
					)}
				</div>

				<div className={css.metaRight}>
					<a
						className={css.date}
						href={postPath}
						onClick={e => {
							e.preventDefault();
							navigate(postPath);
						}}
					>
						<ReadableDate value={Date.parse(post.date)} />
					</a>

					{isInFeed && (
						<>
							<button
								ref={shareButtonRef}
								className={css.metaButton}
								title="Share this post"
								onClick={() => setSharePopupOpen(!isSharePopupOpen)}
							>
								<ShareSvg />
							</button>

							{isSharePopupOpen && (
								<SharePopup
									anchorRef={shareButtonRef}
									horizontalAlign={HorizontalAlignment.END}
									onClose={() => setSharePopupOpen(false)}
									subject="Check out this post on Ylide!"
									url={toAbsoluteUrl(postPath)}
								/>
							)}
						</>
					)}

					{!!post.sourceLink && (
						<a
							className={css.metaButton}
							href={post.sourceLink}
							title="Open post source"
							target="_blank"
							rel="noreferrer"
						>
							<ExternalSvg />
						</a>
					)}
				</div>
			</div>

			<div className={css.body}>
				<FeedPostContent post={post} />

				{post.thread.map(p => (
					<FeedPostContent key={p.id} post={p} />
				))}
			</div>

			{collapsed && (
				<button className={css.readMore} onClick={() => setCollapsed(false)}>
					Read more
				</button>
			)}
		</div>
	);
}

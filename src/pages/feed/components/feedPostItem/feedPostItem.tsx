import clsx from 'clsx';
import React, { MouseEvent, useEffect, useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { FeedManagerApi } from '../../../../api/feedManagerApi';
import { FeedPost, FeedReason, FeedServerApi, LinkType } from '../../../../api/feedServerApi';
import { Avatar } from '../../../../components/avatar/avatar';
import { DropDown, DropDownItem, DropDownItemMode } from '../../../../components/dropDown/dropDown';
import { ErrorMessage, ErrorMessageLook } from '../../../../components/errorMessage/errorMessage';
import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { SharePopup } from '../../../../components/sharePopup/sharePopup';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as ContactSvg } from '../../../../icons/ic20/contact.svg';
import { ReactComponent as MenuSvg } from '../../../../icons/ic20/menu.svg';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { RoutePath } from '../../../../stores/routePath';
import { HorizontalAlignment } from '../../../../utils/alignment';
import { invariant } from '../../../../utils/assert';
import { getSelectedSourceIds, updateFeedConfig } from '../../../../utils/feed';
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
						<a key={idx} className={css.embed} href={e.link} target="_blank" rel="noreferrer">
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
	realtedAccounts?: DomainAccount[];
	post: FeedPost;
}

export function FeedPostItem({ isInFeed, realtedAccounts, post }: FeedPostItemProps) {
	const selfRef = useRef<HTMLDivElement>(null);
	const [collapsed, setCollapsed] = useState(false);
	const navigate = useNav();
	const postPath = generatePath(RoutePath.FEED_POST, { id: post.id });

	const menuButtonRef = useRef(null);
	const [isMenuOpen, setMenuOpen] = useState(false);
	const [isSharePopupOpen, setSharePopupOpen] = useState(false);

	useEffect(() => {
		if (isInFeed && selfRef.current && selfRef.current.getBoundingClientRect().height > 600) {
			setCollapsed(true);
		}
	}, [isInFeed]);

	const onSourceIdClick = () => {
		navigate(generatePath(RoutePath.FEED_SOURCE, { source: post.sourceId }));
	};

	const [unfollowedState, setUnfollowState] = useState<'none' | 'unfollowing' | 'unfollowed'>('none');

	const unfollow = async (entireProject: boolean) => {
		try {
			setUnfollowState('unfollowing');

			invariant(realtedAccounts?.length, 'No accounts');
			invariant(
				realtedAccounts.every(a => a.mainViewKey),
				'Not all accounts have MV key',
			);

			const { sources } = await FeedServerApi.getSources();
			const sourceIdsToExclude = entireProject
				? sources.filter(s => s.cryptoProject?.id === post.cryptoProjectId).map(s => s.id)
				: [post.sourceId];

			invariant(sourceIdsToExclude.length, `No source ids to exclude. post=${post}`);

			await Promise.all(
				realtedAccounts.map(async account => {
					const config = await FeedManagerApi.getConfig({ token: account.mainViewKey });
					const selectedSourceIds = getSelectedSourceIds(sources, config).filter(
						id => !sourceIdsToExclude.includes(id),
					);
					await updateFeedConfig(account.mainViewKey, selectedSourceIds, sources, config);
				}),
			);

			setUnfollowState('unfollowed');
		} catch (e) {
			setUnfollowState('none');
			toast("Couldn't unfollow 🤦‍♀️");
		}
	};

	const reason = post.cryptoProjectReasons[0];

	return (
		<>
			{unfollowedState !== 'none' ? (
				<ErrorMessage look={ErrorMessageLook.INFO}>
					{unfollowedState === 'unfollowing' ? 'Unfollowing ...' : 'You unfollowed such posts 👌'}
				</ErrorMessage>
			) : (
				<div ref={selfRef} className={clsx(css.root, { [css.root_collapsed]: collapsed })}>
					<div className={css.ava}>
						<Avatar image={post.authorAvatar} placeholder={<ContactSvg width="100%" height="100%" />} />
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
							{reason && (
								<div className={css.reason} title="The reason why you see this post">
									{
										{
											[FeedReason.BALANCE]: "You're holding ",
											[FeedReason.PROTOCOL]: "You're in ",
											[FeedReason.TRANSACTION]: 'You used ',
										}[reason]
									}

									<b>{post.cryptoProjectName}</b>
								</div>
							)}

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

							<button
								ref={menuButtonRef}
								className={css.metaButton}
								onClick={() => {
									setSharePopupOpen(false);
									setMenuOpen(!isMenuOpen);
								}}
							>
								<MenuSvg />
							</button>

							{isMenuOpen && (
								<DropDown
									anchorRef={menuButtonRef}
									horizontalAlign={HorizontalAlignment.END}
									onCloseRequest={() => setMenuOpen(false)}
								>
									<DropDownItem
										onSelect={() => {
											setMenuOpen(false);
											setSharePopupOpen(true);
										}}
									>
										Share post
									</DropDownItem>

									{!!post.sourceLink && (
										<a href={post.sourceLink} target="_blank" rel="noreferrer">
											<DropDownItem>Open post source</DropDownItem>
										</a>
									)}

									{!!realtedAccounts?.length && (
										<>
											<DropDownItem mode={DropDownItemMode.LITE} onSelect={() => unfollow(false)}>
												Unfollow{' '}
												<b>{post.authorName}</b>
											</DropDownItem>

											{!!post.cryptoProjectName && (
												<DropDownItem
													mode={DropDownItemMode.LITE}
													onSelect={() => unfollow(true)}
												>
													Unfollow{' '}
													<b>{post.cryptoProjectName}</b>
												</DropDownItem>
											)}
										</>
									)}
								</DropDown>
							)}

							{isSharePopupOpen && (
								<SharePopup
									anchorRef={menuButtonRef}
									horizontalAlign={HorizontalAlignment.END}
									onClose={() => setSharePopupOpen(false)}
									subject="Check out this post on Ylide!"
									url={toAbsoluteUrl(postPath)}
								/>
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
			)}
		</>
	);
}

import clsx from 'clsx';
import { observer } from 'mobx-react';
import { MouseEvent, useMemo, useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { FeedManagerApi } from '../../../../api/feedManagerApi';
import { FeedPost, FeedReason, LinkType } from '../../../../api/feedServerApi';
import { Avatar } from '../../../../components/avatar/avatar';
import { GridRowBox, TruncateTextBox } from '../../../../components/boxes/boxes';
import { CheckBox } from '../../../../components/checkBox/checkBox';
import { DropDown, DropDownItem, DropDownItemMode } from '../../../../components/dropDown/dropDown';
import { ErrorMessage, ErrorMessageLook } from '../../../../components/errorMessage/errorMessage';
import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { SharePopup } from '../../../../components/sharePopup/sharePopup';
import { Spinner } from '../../../../components/spinner/spinner';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as ContactSvg } from '../../../../icons/ic20/contact.svg';
import { ReactComponent as MenuSvg } from '../../../../icons/ic20/menu.svg';
import domain from '../../../../stores/Domain';
import { RoutePath } from '../../../../stores/routePath';
import { formatAccountName } from '../../../../utils/account';
import { HorizontalAlignment } from '../../../../utils/alignment';
import { invariant } from '../../../../utils/assert';
import { toAbsoluteUrl, useNav } from '../../../../utils/url';
import { FeedLinkTypeIcon } from '../feedLinkTypeIcon/feedLinkTypeIcon';
import { PostItemContainer } from '../postItemContainer/postItemContainer';
import css from './feedPostItem.module.scss';
import UserProject = FeedManagerApi.UserProject;
import { DomainAccount } from '../../../../stores/models/DomainAccount';

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

interface AddtoMyFeedItemProps {
	post: FeedPost;
	account: DomainAccount;
}

export const AddToMyFeedItem = observer(({ post, account }: AddtoMyFeedItemProps) => {
	const [isUpdating, setUpdating] = useState(false);

	const isSelected = domain.feedSettings.isSourceSelected(account, post.sourceId);

	const toggle = async () => {
		try {
			setUpdating(true);

			const selectedSourceIds = domain.feedSettings.getSelectedSourceIds(account);

			await domain.feedSettings.updateFeedConfig(
				account,
				isSelected
					? selectedSourceIds.filter(id => id !== post.sourceId)
					: [...selectedSourceIds, post.sourceId],
			);
		} catch (e) {
			toast('Error 🤦‍♀️');
		} finally {
			setUpdating(false);
		}
	};

	return (
		<DropDownItem mode={isUpdating ? DropDownItemMode.DISABLED : undefined} onSelect={toggle}>
			<GridRowBox>
				{isUpdating ? (
					<Spinner size={18} style={{ opacity: 0.8 }} />
				) : (
					<CheckBox isChecked={isSelected} onChange={toggle} />
				)}

				<TruncateTextBox>{formatAccountName(account)}</TruncateTextBox>
			</GridRowBox>
		</DropDownItem>
	);
});

interface AddToMyFeedButtonProps {
	post: FeedPost;
}

export const AddToMyFeedButton = observer(({ post }: AddToMyFeedButtonProps) => {
	const buttonRef = useRef(null);
	const [isListOpen, setListOpen] = useState(false);

	return (
		<>
			<div
				ref={buttonRef}
				className={clsx(css.reason, css.reason_button)}
				onClick={() => setListOpen(!isListOpen)}
			>
				Add to My Feed
			</div>

			{isListOpen && (
				<DropDown
					anchorRef={buttonRef}
					horizontalAlign={HorizontalAlignment.END}
					onCloseRequest={() => setListOpen(false)}
				>
					{domain.account ? <AddToMyFeedItem post={post} account={domain.account} /> : null}
				</DropDown>
			)}
		</>
	);
});

//

interface FeedPostItemProps {
	feedType: 'personal' | 'generic';
	post: FeedPost;
}

export const FeedPostItem = observer(({ post, feedType }: FeedPostItemProps) => {
	const navigate = useNav();
	const postPath = generatePath(RoutePath.FEED_POST, { postId: post.id });

	const menuButtonRef = useRef(null);
	const [isMenuOpen, setMenuOpen] = useState(false);
	const [isSharePopupOpen, setSharePopupOpen] = useState(false);

	const account = domain.account;

	const onSourceIdClick = () => {
		navigate(generatePath(RoutePath.FEED_SOURCE, { source: post.sourceId }));
	};

	const [unfollowedState, setUnfollowState] = useState<'none' | 'unfollowing' | 'unfollowed'>('none');

	const unfollow = async (projectId?: string) => {
		try {
			setUnfollowState('unfollowing');

			invariant(account, 'No accounts');

			const sourceIdsToExclude = projectId
				? domain.feedSettings.sources.filter(s => s.cryptoProject?.id === projectId).map(s => s.id)
				: [post.sourceId];

			invariant(sourceIdsToExclude.length, 'No source ids to exclude');

			const selectedSourceIds = domain.feedSettings
				.getSelectedSourceIds(account)
				.filter(id => !sourceIdsToExclude.includes(id));

			await domain.feedSettings.updateFeedConfig(account, selectedSourceIds);

			setUnfollowState('unfollowed');
		} catch (e) {
			setUnfollowState('none');
			toast("Couldn't unfollow 🤦‍♀️");
			throw e;
		}
	};

	const userCryptoProject = useMemo(() => {
		if (account && post.cryptoProjectId) {
			const config = domain.feedSettings.getAccountConfig(account);
			return config?.defaultProjects.find(p => p.projectId === post.cryptoProjectId);
		}
	}, [post.cryptoProjectId, account]);

	const renderReason = (userCryptoProject: UserProject) => (
		<>
			{
				{
					[FeedReason.BALANCE]: 'You hold tokens of ',
					[FeedReason.PROTOCOL]: 'Current position in ',
					[FeedReason.TRANSACTION]: 'Historical tx in ',
				}[userCryptoProject.reasons[0]]
			}

			<b>{userCryptoProject.projectName}</b>
		</>
	);

	return (
		<>
			{unfollowedState !== 'none' ? (
				<ErrorMessage look={ErrorMessageLook.INFO}>
					{unfollowedState === 'unfollowing' ? 'Unfollowing ...' : 'You unfollowed such posts 👌'}
				</ErrorMessage>
			) : (
				<PostItemContainer className={css.root} isCollapsable>
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
							{feedType === 'personal' ? (
								userCryptoProject &&
								!!userCryptoProject.reasons.length &&
								!!userCryptoProject.projectName && (
									<div
										className={css.reason}
										title="The reason why you see this post"
										onClick={() => toast(renderReason(userCryptoProject))}
									>
										{renderReason(userCryptoProject)}
									</div>
								)
							) : feedType === 'generic' && !userCryptoProject && account ? (
								<AddToMyFeedButton post={post} />
							) : null}

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

									{account && (
										<>
											<DropDownItem mode={DropDownItemMode.LITE} onSelect={() => unfollow()}>
												Unfollow{' '}
												<b>
													{post.sourceType === LinkType.DISCORD
														? post.sourceName
														: post.authorName}
												</b>{' '}
												{post.sourceType}
											</DropDownItem>

											{userCryptoProject && (
												<DropDownItem
													mode={DropDownItemMode.LITE}
													onSelect={() => unfollow(userCryptoProject.projectId)}
												>
													Unfollow everything about <b>{userCryptoProject.projectName}</b>
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
				</PostItemContainer>
			)}
		</>
	);
});

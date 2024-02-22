import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useMemo, useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { FeedPost, LinkType } from '../../../../api/feedServerApi';
import { Avatar } from '../../../../components/avatar/avatar';
import { GridRowBox, TruncateTextBox } from '../../../../components/boxes/boxes';
import { CheckBox } from '../../../../components/checkBox/checkBox';
import { DropDown, DropDownItem, DropDownItemMode } from '../../../../components/dropDown/dropDown';
import { ErrorMessage, ErrorMessageLook } from '../../../../components/errorMessage/errorMessage';
import { ProjectExposureTable } from '../../../../components/feedSettingsModal/projectExposureTable';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { SharePopup } from '../../../../components/sharePopup/sharePopup';
import { SimplePopup } from '../../../../components/simplePopup/simplePopup';
import { Spinner } from '../../../../components/spinner/spinner';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as ContactSvg } from '../../../../icons/ic20/contact.svg';
import { ReactComponent as MenuSvg } from '../../../../icons/ic20/menu.svg';
import { ProjectRelation } from '../../../../shared/PortfolioScope';
import domain from '../../../../stores/Domain';
import { FeedSettings } from '../../../../stores/FeedSettings';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { RoutePath } from '../../../../stores/routePath';
import { formatAccountName } from '../../../../utils/account';
import { HorizontalAlignment } from '../../../../utils/alignment';
import { toAbsoluteUrl, useNav } from '../../../../utils/url';
import { FeedLinkTypeIcon } from '../feedLinkTypeIcon/feedLinkTypeIcon';
import { PostItemContainer } from '../postItemContainer/postItemContainer';
import { FeedPostContent } from './feedPostContent';
import css from './feedPostItem.module.scss';

//

interface AddtoMyFeedItemProps {
	post: FeedPost;
	account: DomainAccount;
}

export const AddToMyFeedItem = observer(({ post, account }: AddtoMyFeedItemProps) => {
	const [isUpdating, setUpdating] = useState(false);

	const isSelected = false; // domain.feedsRepository.isSourceSelected(account, post.sourceId);

	const toggle = async () => {
		try {
			setUpdating(true);

			// const selectedSourceIds = domain.feedsRepository.getSelectedSourceIds(account);

			// await domain.feedsRepository.updateFeedConfig(
			// 	account,
			// 	isSelected
			// 		? selectedSourceIds.filter(id => id !== post.sourceId)
			// 		: [...selectedSourceIds, post.sourceId],
			// );
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
	const [adding, setAdding] = useState(false);
	// const buttonRef = useRef(null);
	// const [isListOpen, setListOpen] = useState(false);

	return (
		<>
			<div
				// ref={buttonRef}
				className={clsx(css.reason, css.reason_button)}
				onClick={() => {
					// setListOpen(!isListOpen)
					if (!domain.account?.defaultFeedId) {
						return;
					}
					const feedData = domain.feedsRepository.feedDataById.get(domain.account.defaultFeedId);
					if (!feedData) {
						return;
					}

					const feedSettings = new FeedSettings(feedData, domain.account.defaultFeedId);

					setAdding(true);
					feedSettings.activateSource(Number(post.sourceId));
					feedSettings.save('FOLLOW').then(() => {
						setAdding(false);
					});
				}}
			>
				{adding ? 'Adding...' : 'Add to My Feed'}
			</div>
			{/* 
			{isListOpen && (
				<DropDown
					anchorRef={buttonRef}
					horizontalAlign={HorizontalAlignment.END}
					onCloseRequest={() => setListOpen(false)}
				>
					{domain.account ? <AddToMyFeedItem post={post} account={domain.account} /> : null}
				</DropDown>
			)} */}
		</>
	);
});

//

interface FeedPostItemProps {
	feedId?: string;
	affinity: 'external' | string;
	post: FeedPost;
}

export const FeedPostItem = observer(({ post, affinity, feedId }: FeedPostItemProps) => {
	const navigate = useNav();
	const postPath = generatePath(RoutePath.FEED_POST, { postId: post.id });

	const menuButtonRef = useRef(null);
	const [isMenuOpen, setMenuOpen] = useState(false);
	const [isSharePopupOpen, setSharePopupOpen] = useState(false);
	const [unfollowedState, setUnfollowState] = useState<'none' | 'unfollowing' | 'unfollowed'>('none');

	const account = domain.account;
	const projectId = post.cryptoProjectId;
	const project = projectId ? domain.feedSources.projectsMap.get(projectId) || null : null;
	const feed =
		affinity === 'external' || affinity === 'default' ? null : domain.feedsRepository.feedDataById.get(affinity);
	const feedSettings = feed ? domain.feedsRepository.feedSettingsById.get(feed.feed.id) : null;
	const defaultFeedSettings = domain.account?.defaultFeedId
		? domain.feedsRepository.feedSettingsById.get(domain.account.defaultFeedId)
		: null;
	const isInDefaultFeed = defaultFeedSettings
		? defaultFeedSettings.activeSourceIds.has(Number(post.sourceId))
		: false;

	const onSourceIdClick = () => {
		navigate(generatePath(RoutePath.FEED_SOURCE, { source: post.sourceId }));
	};

	const unfollowSource = async (_sourceId: string) => {
		if (!feedSettings) {
			return;
		}

		try {
			setUnfollowState('unfollowing');

			feedSettings.deactivateSource(Number(_sourceId));
			await feedSettings.save('UNFOLLOW_SOURCE');

			setUnfollowState('unfollowed');
		} catch (e) {
			setUnfollowState('none');
			toast("Couldn't unfollow 🤦‍♀️");
			throw e;
		}
	};

	const unfollowProject = async (_projectId: number) => {
		if (!feedSettings) {
			return;
		}

		try {
			setUnfollowState('unfollowing');

			feedSettings.deactivateProject(_projectId);
			await feedSettings.save('UNFOLLOW_PROJECT');

			setUnfollowState('unfollowed');
		} catch (e) {
			setUnfollowState('none');
			toast("Couldn't unfollow 🤦‍♀️");
			throw e;
		}
	};

	const relationContent = useMemo(() => {
		if (project && feedSettings && feedSettings.portfolio.projectToPortfolioMetaMap[project.id]) {
			const _relation = feedSettings.portfolio.projectToPortfolioMetaMap[project.id].relation;
			if (_relation === ProjectRelation.ACTIVE_EXPOSURE) {
				return (
					<SimplePopup
						content={
							<ProjectExposureTable
								portfolio={feedSettings.portfolio}
								portfolioSources={feedSettings.base.feed.sources}
								projectId={project.id}
							/>
						}
					>
						<div className={css.reason} title="The reason why you see this post">
							{`Position in ${project.name}`}
						</div>
					</SimplePopup>
				);
			} else if (_relation === ProjectRelation.INTERACTED) {
				return (
					<div
						className={css.reason}
						title="The reason why you see this post"
					>{`Had tx in ${project.name}`}</div>
				);
			} else {
				// hmmmm?
				return null;
			}
		}
		return null;
	}, [project, feedSettings]);

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
							{affinity === 'external' && !isInDefaultFeed ? (
								<AddToMyFeedButton post={post} />
							) : (
								relationContent
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

									{account && (
										<>
											<DropDownItem
												mode={DropDownItemMode.DANGER}
												onSelect={() => unfollowSource(post.sourceId)}
											>
												Unfollow{' '}
												<b>
													{post.sourceType === LinkType.DISCORD
														? post.sourceName
														: post.authorName}
												</b>{' '}
												{post.sourceType}
											</DropDownItem>

											{project && (
												<DropDownItem
													mode={DropDownItemMode.DANGER}
													onSelect={() => unfollowProject(project.id)}
												>
													Unfollow everything about <b>{project.name}</b>
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

import { observer } from 'mobx-react';
import { useRef, useState } from 'react';
import { InView } from 'react-intersection-observer';
import { useInfiniteQuery, useQuery } from 'react-query';
import { useParams } from 'react-router-dom';

import { BlockchainFeedApi, decodeBlockchainFeedPost, DecodedBlockchainFeedPost } from '../../../api/blockchainFeedApi';
import { ActionButton, ActionButtonLook } from '../../../components/ActionButton/ActionButton';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout } from '../../../components/genericLayout/genericLayout';
import { toast } from '../../../components/toast/toast';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { analytics } from '../../../stores/Analytics';
import { BlockchainProjectId, blockchainProjectsMeta } from '../../../stores/blockchainProjects/blockchainProjects';
import { useDomainAccounts, useVenomAccounts } from '../../../stores/Domain';
import { RoutePath } from '../../../stores/routePath';
import { connectAccount } from '../../../utils/account';
import { invariant } from '../../../utils/assert';
import { useIsMatchingRoute } from '../../../utils/url';
import { BlockchainProjectPost } from '../_common/blockchainProjectPost/blockchainProjectPost';
import { CreatePostForm, CreatePostFormApi } from '../_common/createPostForm/createPostForm';
import css from './blockchainProjectFeedPage.module.scss';

export const BlockchainProjectFeedPage = observer(() => {
	const { project } = useParams<{ project?: BlockchainProjectId }>();
	invariant(project, 'Blockchain project must be specified');
	const projectMeta = blockchainProjectsMeta[project];

	const isAdminMode = useIsMatchingRoute(RoutePath.FEED_VENOM_ADMIN) || useIsMatchingRoute(RoutePath.FEED_TVM_ADMIN);

	const allAccounts = useDomainAccounts();
	const venomAccounts = useVenomAccounts();
	const accounts = project === BlockchainProjectId.TVM ? allAccounts : venomAccounts;

	const [currentPost, setCurrentPost] = useState<number>(0);

	const postsQuery = useInfiniteQuery<DecodedBlockchainFeedPost[]>(['feed', 'venom', 'posts', project], {
		queryFn: async ({ pageParam = 0 }) => {
			analytics.venomFeedView(projectMeta.id);

			const posts = await BlockchainFeedApi.getPosts({
				feedId: projectMeta.feedId,
				beforeTimestamp: pageParam,
				adminMode: isAdminMode,
			});
			return posts.map(decodeBlockchainFeedPost);
		},
		getNextPageParam: lastPage =>
			lastPage.length ? lastPage[lastPage.length - 1].original.createTimestamp : undefined,
	});

	const messages = postsQuery.data?.pages.flat() || [];

	const [hasNewPosts, setHasNewPosts] = useState(false);

	useQuery(['feed', 'venom', 'new-posts', project], {
		queryFn: async () => {
			if (!postsQuery.isLoading) {
				const posts = await BlockchainFeedApi.getPosts({
					feedId: projectMeta.feedId,
					beforeTimestamp: 0,
					adminMode: isAdminMode,
				});
				setHasNewPosts(!!(posts.length && messages.length && posts[0].id !== messages[0].original.id));
			} else {
				setHasNewPosts(false);
			}
		},
		refetchInterval: 15 * 1000,
	});

	const serviceStatus = useQuery(['feed', 'venom', 'service-status'], {
		queryFn: async () => (await BlockchainFeedApi.getServiceStatus()).status,
		initialData: 'ACTIVE',
		refetchInterval: 10000,
	});

	const reloadFeed = () => {
		setHasNewPosts(false);
		setCurrentPost(0);
		postsQuery.remove();
		postsQuery.refetch();
	};

	const renderLoadingError = () => <ErrorMessage>Couldn't load posts.</ErrorMessage>;

	const createPostFormRef = useRef<CreatePostFormApi>(null);

	return (
		<GenericLayout>
			<NarrowContent key={project} contentClassName={css.main}>
				<div className={css.projectTitle}>
					<div className={css.projectLogo}>{projectMeta.logo}</div>
					<div className={css.projectName}>{projectMeta.name}</div>
					<div className={css.projectDescription}>{projectMeta.description}</div>
				</div>

				{hasNewPosts && (
					<div className={css.newPostsButtonWrapper}>
						<ActionButton
							className={css.newPostsButton}
							look={ActionButtonLook.SECONDARY}
							onClick={() => reloadFeed()}
						>
							Load new posts
						</ActionButton>
					</div>
				)}

				<div className={css.divider} />

				{accounts.length ? (
					<CreatePostForm
						ref={createPostFormRef}
						projectMeta={projectMeta}
						className={css.createPostForm}
						accounts={accounts}
						displayIdeasButton={projectMeta.id === BlockchainProjectId.VENOM_BLOCKCHAIN}
						isAnavailable={serviceStatus.data !== 'ACTIVE'}
						onCreated={() => toast('Good job! Your post will appear shortly 🔥')}
					/>
				) : (
					<ErrorMessage look={ErrorMessageLook.INFO}>
						<div>Connect your Venom wallet to post messages to Venom feed.</div>

						<ActionButton
							look={ActionButtonLook.PRIMARY}
							onClick={() => connectAccount({ place: 'venom-feed_no-accounts' })}
						>
							Connect account
						</ActionButton>
					</ErrorMessage>
				)}

				{/* <ErrorMessage look={ErrorMessageLook.INFO}>
				Venom Blockchain Is Under Maintenance: To stay informed about the latest developments and announcements,
				we encourage you to check Venom’s official social media channels.
			</ErrorMessage> */}

				<div className={css.divider} />

				<div className={css.posts}>
					{messages.length ? (
						<>
							{messages.map((message, idx) => (
								<BlockchainProjectPost
									key={idx}
									isFirstPost={idx === currentPost}
									post={message}
									onNextPost={() => setCurrentPost(idx + 1)}
									onReplyClick={() => {
										analytics.venomFeedReply(projectMeta.id, message.original.id);

										if (accounts.length) {
											createPostFormRef.current?.replyTo(message);
										} else {
											toast('You need to connect a Venom account in order to reply 👍');
										}
									}}
								/>
							))}

							{postsQuery.isError
								? renderLoadingError()
								: postsQuery.hasNextPage && (
										<InView
											className={css.loader}
											rootMargin="100px"
											onChange={inView => {
												if (inView) {
													analytics.venomFeedLoadMore(projectMeta.id);
													postsQuery.fetchNextPage();
												}
											}}
										>
											<YlideLoader reason="Loading more posts ..." />
										</InView>
								  )}
						</>
					) : postsQuery.isLoading ? (
						<div className={css.loader}>
							<YlideLoader reason="Your feed is loading ..." />
						</div>
					) : postsQuery.isError ? (
						renderLoadingError()
					) : (
						<ErrorMessage look={ErrorMessageLook.INFO}>No messages yet</ErrorMessage>
					)}
				</div>
			</NarrowContent>
		</GenericLayout>
	);
});

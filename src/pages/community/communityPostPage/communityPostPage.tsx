import { MessageAttachmentLinkV1 } from '@ylide/sdk';
import { observer } from 'mobx-react';
import { useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath, useParams } from 'react-router-dom';

import { BlockchainFeedApi, decodeBlockchainFeedPost, DecodedBlockchainFeedPost } from '../../../api/blockchainFeedApi';
import { ActionButton, ActionButtonLook } from '../../../components/ActionButton/ActionButton';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { RegularPageContent } from '../../../components/genericLayout/content/regularPageContent/regularPageContent';
import { GenericLayout } from '../../../components/genericLayout/genericLayout';
import { PageContentHeader } from '../../../components/pageContentHeader/pageContentHeader';
import { PageMeta } from '../../../components/pageMeta/pageMeta';
import { SharePopup } from '../../../components/sharePopup/sharePopup';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { ReactComponent as ShareSvg } from '../../../icons/ic20/share.svg';
import { MessageDecodedTextDataType } from '../../../indexedDB/IndexedDB';
import { getCommunityByFeedId } from '../../../stores/communities/communities';
import domain from '../../../stores/Domain';
import { RoutePath } from '../../../stores/routePath';
import { HorizontalAlignment } from '../../../utils/alignment';
import { invariant } from '../../../utils/assert';
import { ipfsToHttpUrl } from '../../../utils/ipfs';
import { ReactQueryKey } from '../../../utils/reactQuery';
import { toAbsoluteUrl } from '../../../utils/url';
import { DiscussionPost } from '../_common/discussionPost/discussionPost';
import { OfficialPostView } from '../_common/officialPost/officialPost';
import css from './communityPostPage.module.scss';

export function getPostPath(postId: string) {
	return generatePath(RoutePath.POST_ID, { postId: encodeURIComponent(postId) });
}

//

interface CommunityPostContentProps {
	post: DecodedBlockchainFeedPost;
}

const CommunityPostContent = observer(({ post }: CommunityPostContentProps) => {
	const community = getCommunityByFeedId(post.original.feedId);
	const isOfficial = community.feedId.official === post.original.feedId;

	const attachment = post?.decoded.attachments[0] as MessageAttachmentLinkV1 | undefined;
	const attachmentHttpUrl = attachment && ipfsToHttpUrl(attachment.link);

	const shareButtonRef = useRef(null);
	const [isSharePopupOpen, setSharePopupOpen] = useState(false);

	return (
		<>
			<PageContentHeader
				backButton={{
					href: isOfficial
						? generatePath(RoutePath.PROJECT_ID_OFFICIAL, { projectId: community.id })
						: generatePath(RoutePath.PROJECT_ID_DISCUSSION, { projectId: community.id }),
					goBackIfPossible: true,
				}}
				title={community?.name}
				right={
					<>
						<ActionButton
							ref={shareButtonRef}
							look={ActionButtonLook.PRIMARY}
							icon={<ShareSvg />}
							onClick={() => setSharePopupOpen(!isSharePopupOpen)}
						>
							Share Post
						</ActionButton>

						{isSharePopupOpen && (
							<SharePopup
								anchorRef={shareButtonRef}
								horizontalAlign={HorizontalAlignment.END}
								onClose={() => setSharePopupOpen(false)}
								subject="Check out this post on Ylide!"
								url={toAbsoluteUrl(getPostPath(post.original.id))}
							/>
						)}
					</>
				}
			/>

			<PageMeta
				title={
					post.decoded.decodedTextData.type === MessageDecodedTextDataType.YMF
						? post.decoded.decodedTextData.value.toPlainText()
						: post.decoded.decodedTextData.value
				}
				description={`${community.name} // ${community.description}`}
				image={attachmentHttpUrl}
			/>

			{isOfficial ? (
				<OfficialPostView community={community} post={post} />
			) : (
				<DiscussionPost community={community} post={post} />
			)}
		</>
	);
});

//

export const CommunityPostPage = observer(() => {
	const { postId } = useParams<{ postId: string }>();
	invariant(postId);

	const accounts = domain.accounts.activeAccounts;

	const { isLoading, data } = useQuery(ReactQueryKey.communityPost(postId), {
		queryFn: async () => {
			const post = await BlockchainFeedApi.getPost({
				id: postId,
				addresses: accounts.map(a => a.account.address),
			});
			return decodeBlockchainFeedPost(post!);
		},
	});

	return (
		<GenericLayout>
			<RegularPageContent>
				{data ? (
					<CommunityPostContent post={data} />
				) : isLoading ? (
					<YlideLoader className={css.loader} reason="Loading post ..." />
				) : (
					<ErrorMessage>Couldn't load this post</ErrorMessage>
				)}
			</RegularPageContent>
		</GenericLayout>
	);
});

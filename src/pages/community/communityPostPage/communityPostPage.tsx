import { MessageAttachmentLinkV1 } from '@ylide/sdk';
import { observer } from 'mobx-react';
import { useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath, useParams } from 'react-router-dom';

import { BlockchainFeedApi, decodeBlockchainFeedPost } from '../../../api/blockchainFeedApi';
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
import { CommunityId, getCommunityById } from '../../../stores/communities/communities';
import domain from '../../../stores/Domain';
import { RoutePath } from '../../../stores/routePath';
import { HorizontalAlignment } from '../../../utils/alignment';
import { invariant } from '../../../utils/assert';
import { ipfsToHttpUrl } from '../../../utils/ipfs';
import { toAbsoluteUrl } from '../../../utils/url';
import { DiscussionPost, generateDiscussionPostPath } from '../_common/discussionPost/discussionPost';
import { generateOfficialPostPath, OfficialPostView } from '../_common/officialPost/officialPost';
import css from './communityPostPage.module.scss';

export interface CommunityPostPageProps {
	isOfficial: boolean;
}

export const CommunityPostPage = observer(({ isOfficial }: CommunityPostPageProps) => {
	const { projectId, postId } = useParams<{ projectId: CommunityId; postId: string }>();
	invariant(projectId);
	invariant(postId);
	const accounts = domain.accounts.activeAccounts;

	const community = getCommunityById(projectId);
	const postPath = isOfficial
		? generateOfficialPostPath(projectId, postId)
		: generateDiscussionPostPath(projectId, postId);

	const { isLoading, data } = useQuery(['community', 'post', postId], {
		queryFn: async () => {
			const post = await BlockchainFeedApi.getPost({
				id: postId,
				addresses: accounts.map(a => a.account.address),
			});
			return decodeBlockchainFeedPost(post!);
		},
	});

	const attachment = data?.decoded.attachments[0] as MessageAttachmentLinkV1 | undefined;
	const attachmentHttpUrl = attachment && ipfsToHttpUrl(attachment.link);

	const shareButtonRef = useRef(null);
	const [isSharePopupOpen, setSharePopupOpen] = useState(false);

	return (
		<GenericLayout>
			<RegularPageContent>
				<PageContentHeader
					backButton={{
						href: isOfficial
							? generatePath(RoutePath.PROJECT_ID_OFFICIAL, { projectId })
							: generatePath(RoutePath.PROJECT_ID_DISCUSSION, { projectId }),
						goBackIfPossible: true,
					}}
					title={community.name}
					right={
						data && (
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
										url={toAbsoluteUrl(postPath)}
									/>
								)}
							</>
						)
					}
				/>

				{data ? (
					<>
						<PageMeta
							title={
								data.decoded.decodedTextData.type === MessageDecodedTextDataType.YMF
									? data.decoded.decodedTextData.value.toPlainText()
									: data.decoded.decodedTextData.value
							}
							description={`${community.name} // ${community.description}`}
							image={attachmentHttpUrl}
						/>

						{isOfficial ? (
							<OfficialPostView community={community} post={data} />
						) : (
							<DiscussionPost community={community} post={data} />
						)}
					</>
				) : isLoading ? (
					<YlideLoader className={css.loader} reason="Loading post ..." />
				) : (
					<ErrorMessage>Couldn't load this post</ErrorMessage>
				)}
			</RegularPageContent>
		</GenericLayout>
	);
});

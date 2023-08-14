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
import { BlockchainProjectId, getBlockchainProjectById } from '../../../stores/blockchainProjects/blockchainProjects';
import { RoutePath } from '../../../stores/routePath';
import { HorizontalAlignment } from '../../../utils/alignment';
import { invariant } from '../../../utils/assert';
import { ipfsToHttpUrl } from '../../../utils/ipfs';
import { toAbsoluteUrl } from '../../../utils/url';
import { generateOfficialPostPath, OfficialPostView } from '../_common/officialPost/officialPost';
import css from './blockchainProjectPostPage.module.scss';

export const BlockchainProjectPostPage = observer(() => {
	const { projectId, postId } = useParams<{ projectId: BlockchainProjectId; postId: string }>();
	invariant(projectId);
	invariant(postId);

	const project = getBlockchainProjectById(projectId);
	const postPath = generateOfficialPostPath(projectId, postId);

	const { isLoading, data } = useQuery(['feed', 'blockchain-project', 'post', postId], {
		queryFn: async () => {
			const post = await BlockchainFeedApi.getPost({ id: postId });
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
					backButton={{ href: generatePath(RoutePath.PROJECT_ID, { projectId }) }}
					title={project.name}
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
							description={`${project.name} // ${project.description}`}
							image={attachmentHttpUrl}
						/>

						<OfficialPostView project={project} post={data} />
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

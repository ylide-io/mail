import { useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath, useParams } from 'react-router-dom';

import { BlockchainFeedApi, decodeBlockchainFeedPost } from '../../../api/blockchainFeedApi';
import { ActionButton, ActionButtonLook } from '../../../components/ActionButton/ActionButton';
import { GridRowBox } from '../../../components/boxes/boxes';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout } from '../../../components/genericLayout/genericLayout';
import { SharePopup } from '../../../components/sharePopup/sharePopup';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { ReactComponent as ArrowLeftSvg } from '../../../icons/ic20/arrowLeft.svg';
import { ReactComponent as ShareSvg } from '../../../icons/ic20/share.svg';
import { BlockchainProjectId, blockchainProjectsMeta } from '../../../stores/blockchainProjects/blockchainProjects';
import { RoutePath } from '../../../stores/routePath';
import { HorizontalAlignment } from '../../../utils/alignment';
import { invariant } from '../../../utils/assert';
import { toAbsoluteUrl, useNav } from '../../../utils/url';
import {
	BlockchainProjectPostView,
	generateBlockchainProjectPostPath,
} from '../_common/blockchainProjectPost/blockchainProjectPost';
import css from './blockchainProjectFeedPostPage.module.scss';

export function BlockchainProjectFeedPostPage() {
	const { projectId, postId } = useParams<{ projectId: BlockchainProjectId; postId: string }>();
	invariant(projectId);
	invariant(postId);

	const navigate = useNav();

	const projectMeta = blockchainProjectsMeta[projectId];

	const postPath = generateBlockchainProjectPostPath(projectId, postId);

	const { isLoading, data } = useQuery(['feed', 'blockchain-project', 'post', postId], {
		queryFn: async () => {
			const post = await BlockchainFeedApi.getPost({ id: postId });
			return decodeBlockchainFeedPost(post!);
		},
	});

	const shareButtonRef = useRef(null);
	const [isSharePopupOpen, setSharePopupOpen] = useState(false);

	return (
		<GenericLayout>
			<NarrowContent
				title={
					<GridRowBox>
						<ActionButton
							onClick={() => navigate(generatePath(RoutePath.FEED_PROJECT_POSTS, { projectId }))}
							icon={<ArrowLeftSvg />}
						/>
						Post in {projectMeta.name} feed
					</GridRowBox>
				}
				titleRight={
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
			>
				{data ? (
					<BlockchainProjectPostView post={data} />
				) : isLoading ? (
					<YlideLoader className={css.loader} reason="Loading post ..." />
				) : (
					<ErrorMessage>Couldn't load this post</ErrorMessage>
				)}
			</NarrowContent>
		</GenericLayout>
	);
}

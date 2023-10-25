import { useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath, useParams } from 'react-router-dom';

import { FeedServerApi } from '../../../api/feedServerApi';
import { ActionButton, ActionButtonLook } from '../../../components/actionButton/actionButton';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout } from '../../../components/genericLayout/genericLayout';
import { PageMeta } from '../../../components/pageMeta/pageMeta';
import { SharePopup } from '../../../components/sharePopup/sharePopup';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { APP_NAME } from '../../../constants';
import { ReactComponent as ShareSvg } from '../../../icons/ic20/share.svg';
import { RoutePath } from '../../../stores/routePath';
import { HorizontalAlignment } from '../../../utils/alignment';
import { invariant } from '../../../utils/assert';
import { toAbsoluteUrl } from '../../../utils/url';
import { FeedPostItem } from '../_common/feedPostItem/feedPostItem';
import css from './feedPostPage.module.scss';

export function FeedPostPage() {
	const { postId } = useParams<{ postId: string }>();
	invariant(postId);

	const postPath = generatePath(RoutePath.FEED_POST_ID, { postId: postId });

	const { isLoading, data } = useQuery(['feed', 'post', postId], () => FeedServerApi.getPost(postId));

	const shareButtonRef = useRef(null);
	const [isSharePopupOpen, setSharePopupOpen] = useState(false);

	return (
		<GenericLayout>
			{data && (
				<PageMeta
					title={`Post by ${
						[data.post.authorName, data.post.authorNickname].filter(Boolean).join(' @ ') ||
						data.post.sourceName ||
						'alien'
					} | ${APP_NAME}`}
				/>
			)}

			<NarrowContent
				title="Post"
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
					<FeedPostItem post={data.post} />
				) : isLoading ? (
					<YlideLoader className={css.loader} reason="Loading post ..." />
				) : (
					<ErrorMessage>Couldn't load this post</ErrorMessage>
				)}
			</NarrowContent>
		</GenericLayout>
	);
}

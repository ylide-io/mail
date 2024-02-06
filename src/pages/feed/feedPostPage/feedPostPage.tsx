import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from 'react-query';
import { generatePath, useParams } from 'react-router-dom';

import { FeedServerApi } from '../../../api/feedServerApi';
import { ActionButton, ActionButtonLook } from '../../../components/ActionButton/ActionButton';
import { GridRowBox } from '../../../components/boxes/boxes';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { NarrowContent } from '../../../components/genericLayout/content/narrowContent/narrowContent';
import { GenericLayout } from '../../../components/genericLayout/genericLayout';
import { SharePopup } from '../../../components/sharePopup/sharePopup';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { APP_NAME } from '../../../constants';
import { ReactComponent as ArrowLeftSvg } from '../../../icons/ic20/arrowLeft.svg';
import { ReactComponent as ShareSvg } from '../../../icons/ic20/share.svg';
import { RoutePath } from '../../../stores/routePath';
import { HorizontalAlignment } from '../../../utils/alignment';
import { invariant } from '../../../utils/assert';
import { toAbsoluteUrl, useNav, usePreviousUrl } from '../../../utils/url';
import { FeedPostItem } from '../_common/feedPostItem/feedPostItem';
import css from './feedPostPage.module.scss';

export function FeedPostPage() {
	const navigate = useNav();
	const previousUrl = usePreviousUrl();

	const { postId } = useParams<{ postId: string }>();
	invariant(postId);

	const postPath = generatePath(RoutePath.FEED_POST, { postId: postId });

	const { isLoading, data } = useQuery(['feed', 'post', postId], () => FeedServerApi.getPost(postId));

	const shareButtonRef = useRef(null);
	const [isSharePopupOpen, setSharePopupOpen] = useState(false);

	return (
		<GenericLayout>
			{data && (
				<Helmet>
					<title>
						Post by{' '}
						{[data.post.authorName, data.post.authorNickname].filter(Boolean).join(' @ ') ||
							data.post.sourceName ||
							'alien'}{' '}
						| {APP_NAME}
					</title>
				</Helmet>
			)}

			<NarrowContent
				title={
					<GridRowBox gap={8}>
						<ActionButton
							icon={<ArrowLeftSvg />}
							onClick={() => navigate(previousUrl || generatePath(RoutePath.FEED_SMART))}
						/>
						Post
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

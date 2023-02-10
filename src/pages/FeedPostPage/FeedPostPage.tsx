import { useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';

import { FeedServerApi } from '../../api/feedServerApi';
import { ActionButton, ActionButtonStyle } from '../../components/ActionButton/ActionButton';
import { ErrorMessage } from '../../components/errorMessage/errorMessage';
import { FeedLayout } from '../../components/feedLayout/feedLayout';
import { FeedPostItem } from '../../components/feedPostItem/feedPostItem';
import { SharePopup } from '../../components/sharePopup/sharePopup';
import { YlideLoader } from '../../components/ylideLoader/ylideLoader';
import { ReactComponent as ShareSvg } from '../../icons/share.svg';
import { HorizontalAlignment } from '../../utils/alignment';
import { invariant } from '../../utils/invariant';
import css from './FeedPostPage.module.scss';

export function FeedPostPage() {
	const { id: postId } = useParams<{ id: string }>();
	invariant(postId);

	const { isLoading, data } = useQuery('post', () => FeedServerApi.getPost(postId));

	const shareButtonRef = useRef(null);
	const [isSharePopupOpen, setSharePopupOpen] = useState(false);

	return (
		<FeedLayout
			title="Post"
			titleRight={
				data && (
					<>
						<ActionButton
							ref={shareButtonRef}
							style={ActionButtonStyle.Primary}
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
		</FeedLayout>
	);
}

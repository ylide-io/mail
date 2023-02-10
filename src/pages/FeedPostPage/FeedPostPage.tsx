import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';

import { FeedServerApi } from '../../api/feedServerApi';
import { ErrorMessage } from '../../components/errorMessage/errorMessage';
import { FeedLayout } from '../../components/feedLayout/feedLayout';
import { FeedPostItem } from '../../components/feedPostItem/feedPostItem';
import { YlideLoader } from '../../components/ylideLoader/ylideLoader';
import { invariant } from '../../utils/invariant';
import css from './FeedPostPage.module.scss';

export function FeedPostPage() {
	const { id: postId } = useParams<{ id: string }>();
	invariant(postId);

	const { isLoading, data } = useQuery('post', () => FeedServerApi.getPost(postId));

	return (
		<FeedLayout title="Post">
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

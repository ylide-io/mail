import { useQuery } from 'react-query';
import { generatePath } from 'react-router-dom';

import { OtcApi } from '../../../api/otcApi';
import { AdaptiveAddress } from '../../../components/adaptiveAddress/adaptiveAddress';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { RoutePath } from '../../../stores/routePath';
import { DateFormatStyle, formatDate } from '../../../utils/date';
import { useNav } from '../../../utils/url';
import { OtcLayout } from '../_common/otcLayout/otcLayout';
import { OtcTable } from '../_common/otcTable/otcTable';
import css from './OtcChatsPage.module.scss';

export function OtcChatsPage() {
	const navigate = useNav();

	const { isError, data } = useQuery(['otc', 'chats'], () => OtcApi.queryThreads());

	return (
		<OtcLayout title="Chats">
			{data ? (
				<>
					<OtcTable
						columns={[
							{
								title: 'Address',
								gridSize: '2fr',
							},
							{
								title: 'Last Message',
								gridSize: '1fr',
							},
						]}
						data={data.entries.map(entry => ({
							content: [
								<AdaptiveAddress address={entry.address} />,
								formatDate(entry.lastMessageDate, DateFormatStyle.LONG),
							],
							onClick: () =>
								navigate({
									path: generatePath(RoutePath.OTC_CHAT, { address: entry.address }),
								}),
						}))}
					/>
				</>
			) : isError ? (
				<ErrorMessage>Couldn't load chats</ErrorMessage>
			) : (
				<YlideLoader className={css.loader} reason="Loading chats ..." />
			)}
		</OtcLayout>
	);
}

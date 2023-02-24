import { useQuery } from 'react-query';
import { generatePath, useSearchParams } from 'react-router-dom';

import { OtcApi } from '../../../api/otcApi';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { AdaptiveAddress } from '../../../controls/adaptiveAddress/adaptiveAddress';
import { RoutePath } from '../../../stores/routePath';
import { invariant } from '../../../utils/invariant';
import { buildUrl, useNav } from '../../../utils/url';
import { OtcAsideStatistics } from '../components/otcAsideStatistics/otcAsideStatistics';
import { OtcLayout } from '../components/otcLayout/otcLayout';
import { OtcPagination } from '../components/otcPagination/otcPagination';
import { OtcTable } from '../components/otcTable/otcTable';
import css from './OtcWalletsPage.module.scss';

const PAGE_SIZE = 50;

export function OtcWalletsPage() {
	const navigate = useNav();

	const [searchParams] = useSearchParams();
	const page = Number(searchParams.get('page')) || 1;
	const token = searchParams.get('token');
	const chain = searchParams.get('chain');
	invariant(token && chain);

	const { isError, data } = useQuery(['otc', 'wallets', page, token, chain], () =>
		OtcApi.queryWalletsByToken({ token, chainQuery: chain, offset: page * PAGE_SIZE, limit: PAGE_SIZE }),
	);

	return (
		<OtcLayout
			title={`${token} Wallets`}
			aside={
				data && (
					<OtcAsideStatistics
						rows={[
							{
								title: `${data.totalCount} wallets`,
								description: 'connected to Ylide',
							},
							{
								title: `$${data.totalValue} value`,
								description: 'connected to Ylide',
							},
						]}
					/>
				)
			}
			supContent="Discover assets owned by Ylide users and start a new deal"
		>
			{data ? (
				<>
					<OtcTable
						columns={[
							{
								title: 'Wallet',
								gridSize: '1fr',
							},
							{
								title: 'Balance',
								gridSize: '1fr',
							},
							{
								title: 'Total Value',
								gridSize: '1fr',
							},
							{
								title: 'Chain',
								gridSize: '1fr',
							},
							{
								title: '',
								gridSize: '1fr',
							},
						]}
						data={data.wallets.map(wallet => ({
							content: [
								<AdaptiveAddress address={wallet.address} />,
								wallet.balance,
								wallet.value,
								wallet.blockchain,
								<button
									className={css.messageButton}
									onClick={() =>
										navigate(generatePath(RoutePath.OTC_CHAT, { address: wallet.address }))
									}
								>
									Message
								</button>,
							],
						}))}
					/>

					<OtcPagination
						currentPage={page}
						totalPages={data.totalCount / PAGE_SIZE}
						generateUrl={forPage =>
							buildUrl({
								path: generatePath(RoutePath.OTC_WALLETS),
								search: {
									token,
									chain,
									...(forPage > 1 ? { page: forPage.toString() } : {}),
								},
							})
						}
					/>
				</>
			) : isError ? (
				<ErrorMessage>Couldn't load wallets</ErrorMessage>
			) : (
				<YlideLoader className={css.loader} reason="Loading wallets ..." />
			)}
		</OtcLayout>
	);
}

import { ReactNode, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath, useSearchParams } from 'react-router-dom';

import { OtcApi } from '../../../api/otcApi';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { RoutePath } from '../../../stores/routePath';
import { formatMoney } from '../../../utils/money';
import { formatNumber } from '../../../utils/number';
import { buildUrl, useNav } from '../../../utils/url';
import { OtcAsideStatistics } from '../components/otcAsideStatistics/otcAsideStatistics';
import { OtcLayout } from '../components/otcLayout/otcLayout';
import { OtcPagination } from '../components/otcPagination/otcPagination';
import { OtcTable } from '../components/otcTable/otcTable';
import css from './OtcAssetsPage.module.scss';

const PAGE_SIZE = 50;

export function OtcAssetsPage() {
	const navigate = useNav();

	const [searchParams] = useSearchParams();
	const page = Number(searchParams.get('page')) || 1;

	const [tokenQuery, setTokenQuery] = useState('');
	const [chainQuery, setChainQuery] = useState('');

	const { isError, data } = useQuery(['otc', 'assets', page], () =>
		OtcApi.queryAssets({ tokenQuery, chainQuery, offset: page * PAGE_SIZE, limit: PAGE_SIZE }),
	);

	const [aside, setAside] = useState<ReactNode>();
	useEffect(() => {
		setAside(prev =>
			data ? (
				<OtcAsideStatistics
					rows={[
						{
							title: `${formatNumber(data.totalWallets)} wallets`,
							description: 'connected to Ylide',
						},
						{
							title: `${formatMoney(data.totalValue)} value`,
							description: 'connected to Ylide',
						},
					]}
				/>
			) : (
				prev
			),
		);
	}, [data]);

	return (
		<OtcLayout
			title="Asset Explorer"
			aside={aside}
			supContent="Discover assets owned by Ylide users and start a new deal"
		>
			{data ? (
				<>
					<OtcTable
						columns={[
							{
								title: 'Token',
								gridSize: '1fr',
							},
							{
								title: 'Wallets',
								gridSize: '1fr',
							},
							{
								title: 'Total Amount',
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
						]}
						data={data.assets.map(asset => ({
							content: [
								asset.token,
								asset.totalWallets,
								formatNumber(asset.totalAmount),
								formatMoney(asset.totalValue),
								asset.blockchain,
							],
							onClick: () =>
								navigate({
									path: generatePath(RoutePath.OTC_WALLETS),
									search: { token: asset.token, chain: asset.blockchain },
								}),
						}))}
					/>

					<OtcPagination
						currentPage={page}
						totalPages={data.totalCount / PAGE_SIZE}
						generateUrl={forPage =>
							buildUrl({
								path: generatePath(RoutePath.OTC_ASSETS),
								search: forPage > 1 ? { page: forPage.toString() } : undefined,
							})
						}
					/>
				</>
			) : isError ? (
				<ErrorMessage>Couldn't load assets</ErrorMessage>
			) : (
				<YlideLoader className={css.loader} reason="Loading assets ..." />
			)}
		</OtcLayout>
	);
}

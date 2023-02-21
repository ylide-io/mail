import { useState } from 'react';
import { useQuery } from 'react-query';
import { generatePath } from 'react-router-dom';

import { OtcApi } from '../../../api/otcApi';
import { ErrorMessage } from '../../../components/errorMessage/errorMessage';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import { OtcAsideStatistics } from '../components/otcAsideStatistics/otcAsideStatistics';
import { OtcLayout } from '../components/otcLayout/otcLayout';
import { OtcTable } from '../components/otcTable/otcTable';
import css from './OtcAssetsPage.module.scss';

export function OtcAssetsPage() {
	const navigate = useNav();

	const [tokenQuery, setTokenQuery] = useState('');
	const [chainQuery, setChainQuery] = useState('');

	const { isError, data } = useQuery('otc_assets', () =>
		OtcApi.queryAssets(tokenQuery, chainQuery, null, 0, Number.MAX_SAFE_INTEGER),
	);

	return (
		<OtcLayout
			title="Asset Explorer"
			aside={
				data && (
					<OtcAsideStatistics
						rows={[
							{
								title: `${data.totalWallets} wallets`,
								description: 'connected to Ylide',
							},
							{
								title: `${data.totalValue} value`,
								description: 'connected to Ylide',
							},
						]}
					/>
				)
			}
			supContent="Discover assets owned by Ylide users and start a new deal"
		>
			{data ? (
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
							asset.totalAmount,
							asset.totalValue,
							asset.blockchain,
						],
						onClick: () =>
							navigate({
								path: generatePath(RoutePath.OTC_WALLETS),
								search: { token: asset.token, chain: asset.blockchain },
							}),
					}))}
				/>
			) : isError ? (
				<ErrorMessage>Couldn't load assets</ErrorMessage>
			) : (
				<YlideLoader className={css.loader} reason="Loading assets ..." />
			)}
		</OtcLayout>
	);
}

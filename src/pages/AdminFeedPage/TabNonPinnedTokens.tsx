import { useContext } from 'react';

import { SCANNERS } from './constants';
import { DataContext } from './DataContext';
import { PaginatorComponent } from './Paginator';

export const TabNonPinnedTokens = () => {
	const {
		nonPinnedTokenQuery,
		setNonPinnedTokenQuery,
		fetchNonPinnedTokens,
		nonPinnedTokens,
		// selectedTokens,
		// setSelectedTokens,
		tokenIds,
		setTokenIds,
		smartGuessToken,
	} = useContext(DataContext);

	return (
		<>
			<input
				type="search"
				style={{
					border: '1px solid #e0e0e0',
					margin: 20,
					height: 30,
					backgroundColor: 'white',
					width: 300,
					appearance: 'auto',
				}}
				value={nonPinnedTokenQuery}
				onChange={e => {
					setNonPinnedTokenQuery(e.target.value);
				}}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						e.preventDefault();
						fetchNonPinnedTokens();
					}
				}}
				placeholder="Search tokens"
			/>
			<PaginatorComponent p={nonPinnedTokens} updatePage={fetchNonPinnedTokens} />
			<table style={{ marginTop: 30 }}>
				<thead>
					<tr>
						<th style={{ textAlign: 'left', paddingBottom: 10 }}></th>
						<th style={{ textAlign: 'left', paddingBottom: 10 }}>Token</th>
						<th style={{ textAlign: 'left', paddingBottom: 10 }}>Symbol</th>
						<th style={{ textAlign: 'left', paddingBottom: 10 }}>Scan</th>
						<th style={{ textAlign: 'left', paddingBottom: 10 }}>Smart guess</th>
						<th style={{ textAlign: 'left', paddingBottom: 10 }}>Attach</th>
					</tr>
				</thead>
				<tbody>
					{nonPinnedTokens.items.map((token, index) => (
						<tr key={index}>
							<td style={{ verticalAlign: 'top' }}>
								<input
									style={{ appearance: 'auto' }}
									type="checkbox"
									checked={tokenIds.some(id =>
										'token' in token ? token.token === id : token.id === id,
									)}
									onChange={e => {
										if (e.target.checked) {
											setTokenIds(t => [...t, 'token' in token ? token.token : token.id]);
										} else {
											setTokenIds(ids =>
												ids.filter(id =>
													'token' in token ? token.token !== id : id !== token.id,
												),
											);
										}
									}}
								/>
							</td>
							<td
								style={{
									marginBottom: 5,
									paddingBottom: 5,
									borderBottom: '1px solid #e0e0e0',
								}}
							>
								{token.name}
							</td>
							<td
								style={{
									marginBottom: 5,
									paddingBottom: 5,
									borderBottom: '1px solid #e0e0e0',
								}}
							>
								{'symbol' in token ? token.symbol : 'Its a protocol'}
							</td>
							<td
								style={{
									marginBottom: 5,
									paddingBottom: 5,
									borderBottom: '1px solid #e0e0e0',
								}}
							>
								{'token' in token ? (
									<a
										href={
											SCANNERS[token.token.split(':')[0]] +
											'/address/' +
											token.token.split(':').slice(1).join(':') +
											'#code'
										}
										target="_blank"
										rel="noreferrer"
									>
										{token.token}
									</a>
								) : (
									<p>token.id</p>
								)}
							</td>
							<td
								style={{
									marginBottom: 5,
									paddingBottom: 5,
									borderBottom: '1px solid #e0e0e0',
								}}
							>
								<a
									href="#"
									onClick={e => {
										e.preventDefault();
										smartGuessToken('token' in token ? token.token : token.id);
									}}
								>
									Extract data
								</a>
							</td>
							<td
								style={{
									marginBottom: 8,
									paddingBottom: 8,
									borderBottom: '1px solid #c0c0c0',
								}}
							>
								Select project
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
};

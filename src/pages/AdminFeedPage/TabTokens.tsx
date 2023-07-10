import { useContext } from 'react';

import { SCANNERS } from './constants';
import { DataContext } from './DataContext';
import { PaginatorComponent } from './Paginator';

export const TabTokens = () => {
	const {
		tokenQuery,
		setTokenQuery,
		fetchTokens,
		tokens,
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
				value={tokenQuery}
				onChange={e => {
					setTokenQuery(e.target.value);
				}}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						e.preventDefault();
						fetchTokens();
					}
				}}
				placeholder="Search tokens"
			/>
			<PaginatorComponent p={tokens} updatePage={fetchTokens} />
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
					{tokens.items.map((token, index) => (
						<tr key={index}>
							<td style={{ verticalAlign: 'top' }}>
								<input
									style={{ appearance: 'auto' }}
									type="checkbox"
									checked={tokenIds.some(id => id === token.token)}
									onChange={e => {
										if (e.target.checked) {
											setTokenIds(t => [...t, token.token]);
										} else {
											setTokenIds(ids => ids.filter(id => id !== token.token));
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
								{token.symbol}
							</td>
							<td
								style={{
									marginBottom: 5,
									paddingBottom: 5,
									borderBottom: '1px solid #e0e0e0',
								}}
							>
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
										smartGuessToken(token.token);
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

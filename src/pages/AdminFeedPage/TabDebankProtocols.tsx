import { useContext } from 'react';

import { Button } from './Button';
import { DataContext } from './DataContext';
import { PaginatorComponent } from './Paginator';
import { DebankKeys } from './types';

export const TabDebankProtocols = () => {
	const {
		debankQuery,
		setDebankQuery,
		fetchDebankProtocols,
		debankProtocols,
		// selectedDebankProtocols,
		// setSelectedDebankProtocols,
		tokenIds,
		setTokenIds,
	} = useContext(DataContext);

	console.log(debankProtocols);

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
				value={debankQuery}
				onChange={e => {
					setDebankQuery(e.target.value);
				}}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						e.preventDefault();
						fetchDebankProtocols();
					}
				}}
				placeholder="Search projects"
			/>
			<PaginatorComponent p={debankProtocols} updatePage={fetchDebankProtocols} />
			<table style={{ width: '100%' }}>
				<thead>
					<tr>
						<th> </th>
						{DebankKeys.map(k => (
							<th>{k}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{debankProtocols.items.map((p, index) => (
						<tr
							key={index}
							style={{
								marginBottom: 5,
								borderBottom: '1px solid #e0e0e0',
							}}
						>
							<td style={{ verticalAlign: 'top' }}>
								<input
									style={{ appearance: 'auto' }}
									type="checkbox"
									checked={tokenIds.some(id => p.id === id)}
									onChange={e => {
										if (e.target.checked) {
											setTokenIds(t => [...t, p.id]);
										} else {
											setTokenIds(ids => ids.filter(id => id !== p.id));
										}
									}}
								/>
							</td>
							{DebankKeys.map(k => (
								<td style={{ verticalAlign: 'top', maxWidth: '100px', wordWrap: 'break-word' }}>
									{JSON.stringify(p[k])}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
};

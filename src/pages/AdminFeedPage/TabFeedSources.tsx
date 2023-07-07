import { useContext } from 'react';

import { DataContext } from './DataContext';
import { PaginatorComponent } from './Paginator';
import { FeedSourceKey } from './types';

export const TabFeedSources = () => {
	const {
		feedSourceQuery,
		setFeedSourceQuery,
		fetchFeedSources,
		feedSources,
		selectedFeedSources,
		setSelectedFeedSources,
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
				value={feedSourceQuery}
				onChange={e => {
					setFeedSourceQuery(e.target.value);
				}}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						e.preventDefault();
						fetchFeedSources();
					}
				}}
				placeholder="Search projects"
			/>
			<PaginatorComponent p={feedSources} updatePage={fetchFeedSources} />
			<table style={{ width: '100%' }}>
				<thead>
					<tr>
						<th> </th>
						{FeedSourceKey.map(k => (
							<th>{k}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{feedSources.items.map((project, index) => (
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
									checked={selectedFeedSources.some(p => p.id === project.id)}
									onChange={e => {
										if (e.target.checked) {
											setSelectedFeedSources(p => [...p, project]);
										} else {
											setSelectedFeedSources(p => p.filter(_p => _p.id !== project.id));
										}
									}}
								/>
							</td>
							{FeedSourceKey.map(k => (
								<td
									style={{
										verticalAlign: 'top',
										maxWidth: '100px',
										wordWrap: 'break-word',
										padding: '10px',
									}}
								>
									{JSON.stringify(project[k])}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
};

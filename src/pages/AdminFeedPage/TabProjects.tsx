import { useContext } from 'react';

import { DataContext } from './DataContext';
import { PaginatorComponent } from './Paginator';
import { ProjectKeys } from './types';

export const TabProjects = () => {
	const { projectQuery, setProjectQuery, fetchProjects, projects, selectedProjects, setSelectedProjects } =
		useContext(DataContext);

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
				value={projectQuery}
				onChange={e => {
					setProjectQuery(e.target.value);
				}}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						e.preventDefault();
						fetchProjects();
					}
				}}
				placeholder="Search projects"
			/>
			<PaginatorComponent p={projects} updatePage={fetchProjects} />
			<table style={{ width: '100%' }}>
				<thead>
					<tr>
						<th> </th>
						{ProjectKeys.map(k => (
							<th>{k}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{projects.items.map((project, index) => (
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
									checked={selectedProjects.some(p => p.id === project.id)}
									onChange={e => {
										if (e.target.checked) {
											setSelectedProjects(p => [...p, project]);
										} else {
											setSelectedProjects(p => p.filter(_p => _p.id !== project.id));
										}
									}}
								/>
							</td>
							{ProjectKeys.map(k => (
								<td style={{ verticalAlign: 'top', maxWidth: '100px', wordWrap: 'break-word' }}>
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

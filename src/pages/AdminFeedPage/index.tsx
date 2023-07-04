import { useEffect, useState } from 'react';

import { Button } from './Button';
import { BASE_URL, DEFAULT_PAGINATOR, SCANNERS } from './constants';
import { GuessProjectModal } from './GuessProjectModal';
import { IProjectEntity, ITokenEntity, Paginator } from './types';

export const AdminFeedPage = () => {
	const [projects, setProjects] = useState<Paginator<IProjectEntity>>(DEFAULT_PAGINATOR);
	const [tokens, setTokens] = useState<Paginator<ITokenEntity>>(DEFAULT_PAGINATOR);
	const [nonPinnedTokens, setNonPinnedTokens] = useState<Paginator<ITokenEntity>>(DEFAULT_PAGINATOR);
	const [tab, setTab] = useState<'tokens' | 'projects'>('tokens');
	const [selectedProjects, setSelectedProjects] = useState<IProjectEntity[]>([]);
	const [selectedTokens, setSelectedTokens] = useState<ITokenEntity[]>([]);
	const [guessData, setGuessData] = useState('');
	const [projectQuery, setProjectQuery] = useState('');
	const [tokenQuery, setTokenQuery] = useState('');

	useEffect(() => {
		// fetchTokens();
		fetchNonPinnedTokens();
		fetchProjects();
	}, []);

	async function fetchProjects() {
		const response = await fetch(`${BASE_URL}/projects?query=` + encodeURIComponent(projectQuery));
		const { data } = await response.json();
		setProjects(data);
		setSelectedProjects([]);
	}

	async function fetchNonPinnedTokens() {
		const response = await fetch(`${BASE_URL}/non-pinned-tokens?query=` + encodeURIComponent(tokenQuery));
		const { data } = await response.json();
		setNonPinnedTokens(data);
	}

	async function fetchTokens() {
		const response = await fetch(`${BASE_URL}/tokens?query=` + encodeURIComponent(tokenQuery));
		const { data } = await response.json();
		setTokens(data);
	}

	async function smartGuessToken(token: ITokenEntity) {
		const response = await fetch(`${BASE_URL}/smart-guess-token?token=` + encodeURIComponent(token.token));
		const result = await response.json();
		console.log(result);
		if (result.result) {
			setSelectedTokens([token]);
			setGuessData(JSON.stringify(result.data, null, '  '));
		}
	}

	async function mergeProjects(projectIds: string[]) {
		const firstProject = projects.items.find(p => p.id === projectIds[0]);
		const newName = prompt('New name: ', firstProject?.name);
		if (!newName) return;
		const response = await fetch(`${BASE_URL}/merge-projects`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ projectIds, newName }),
		});
		const result = await response.json();
		if (result.success) {
			await fetchProjects();
		}
	}

	const isMergeDisabled = selectedProjects.length < 2;

	async function doMergeProjects() {
		if (isMergeDisabled) return;
		await mergeProjects(selectedProjects.map(p => p.id));
	}

	const tokenAttachmentDisabled = selectedProjects.length !== 1 || selectedTokens.length === 0;

	async function attachTokensToProject() {
		if (tokenAttachmentDisabled) {
			return;
		}
		const response = await fetch(`${BASE_URL}/pin-token-to-project`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ projectId: selectedProjects[0].id, tokens: selectedTokens.map(t => t.token) }),
		});
		const result = await response.json();
		return result.success;
	}

	async function createProject(data: { name: string; logo: string | null; meta: any; slug: string }) {
		const response = await fetch(`${BASE_URL}/create-project`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});
		const result = await response.json();
		return result.success;
	}

	async function doCreateProject() {
		const name = prompt('Name');
		if (!name) return;
		await createProject({
			name: name || '',
			logo: null,
			meta: {},
			slug: name.toLowerCase().replaceAll(/\s/g, '-'),
		});
		await fetchProjects();
	}

	console.log(guessData);

	return (
		<>
			{guessData ? (
				<GuessProjectModal
					token={selectedTokens[0].token}
					guessData={guessData}
					onClose={refresh => {
						setGuessData('');
						if (refresh) {
							fetchNonPinnedTokens();
						}
					}}
				/>
			) : null}

			<div
				style={{
					padding: 20,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'stretch',
					justifyContent: 'flex-start',
				}}
			>
				<h2 style={{ fontSize: 26, marginBottom: 30 }}>AdminFeedPage</h2>
				<div>
					<Button onClick={fetchNonPinnedTokens} disabled={false} text={'Refresh'} />
					<Button onClick={doCreateProject} disabled={false} text={'Create project'} />
					<Button onClick={doMergeProjects} disabled={isMergeDisabled} text={'Merge projects'} />
					<Button onClick={attachTokensToProject} disabled={tokenAttachmentDisabled} text={'Attach tokens'} />
				</div>
				<div>
					<button
						style={{
							background: tab === 'tokens' ? 'black' : 'transparent',
							color: tab === 'tokens' ? 'white' : 'black',
							border: '1px solid black',
							padding: '5px 10px',
							margin: 5,
							borderRadius: 20,
						}}
						onClick={() => setTab('tokens')}
					>
						Non Pinned Tokens{nonPinnedTokens ? ` (${nonPinnedTokens.items.length})` : ''}
					</button>
					<button
						style={{
							background: tab === 'projects' ? 'black' : 'transparent',
							color: tab === 'projects' ? 'white' : 'black',
							border: '1px solid black',
							padding: '5px 10px',
							margin: 5,
							borderRadius: 20,
						}}
						onClick={() => setTab('projects')}
					>
						Projects{projects ? ` (${projects.items.length})` : ''}
					</button>
				</div>
				{tab === 'tokens' ? (
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
									fetchNonPinnedTokens();
								}
							}}
							placeholder="Search tokens"
						/>
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
												checked={selectedTokens.some(t => t.token === token.token)}
												onChange={e => {
													if (e.target.checked) {
														setSelectedTokens(t => [...t, token]);
													} else {
														setSelectedTokens(t =>
															t.filter(_t => _t.token !== token.token),
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
													smartGuessToken(token);
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
				) : (
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
						<table>
							<thead>
								<tr>
									<th> </th>
									<th>Project</th>
									<th>Associated tokens</th>
									<th>Smth</th>
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
										<td style={{ verticalAlign: 'top' }}>{project.name}</td>
										<td style={{ verticalAlign: 'top' }}>
											{project.links?.map(l => (
												<p>{l.token}</p>
											))}
										</td>
										<td style={{ verticalAlign: 'top' }}>
											<pre style={{ fontSize: 10 }}>
												{Array.isArray(project.meta)
													? JSON.stringify(project.meta, null, 2)
													: JSON.stringify(project.meta?.coingecko, null, 2)}
											</pre>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</>
				)}
			</div>
		</>
	);
};

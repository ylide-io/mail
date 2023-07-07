import { useEffect, useState } from 'react';

import { Button } from './Button';
import { BASE_URL, DEFAULT_PAGINATOR } from './constants';
import { DataContext } from './DataContext';
import { GuessProjectModal } from './GuessProjectModal';
import { TabDebankProtocols } from './TabDebankProtocols';
import { TabNonPinnedTokens } from './TabNonPinnedTokens';
import { TabProjects } from './TabProjects';
import { TabTokens } from './TabTokens';
import { IDebankProtocol, IProjectEntity, ITokenEntity, Paginator } from './types';

export const AdminFeedPage = () => {
	const [guessData, setGuessData] = useState('');
	const [tab, setTab] = useState<'non-pinned-tokens' | 'tokens' | 'projects' | 'debank-protocols'>(
		'non-pinned-tokens',
	);

	const [projects, setProjects] = useState<Paginator<IProjectEntity>>(DEFAULT_PAGINATOR);
	const [nonPinnedTokens, setNonPinnedTokens] = useState<Paginator<ITokenEntity>>(DEFAULT_PAGINATOR);
	const [debankProtocols, setDebankProtocols] = useState<Paginator<IDebankProtocol>>(DEFAULT_PAGINATOR);
	const [tokens, setTokens] = useState<Paginator<ITokenEntity>>(DEFAULT_PAGINATOR);

	const [projectQuery, setProjectQuery] = useState('');
	const [tokenQuery, setTokenQuery] = useState('');
	const [nonPinnedTokenQuery, setNonPinnedTokenQuery] = useState('');
	const [debankQuery, setDebankQuery] = useState('');

	const [selectedProjects, setSelectedProjects] = useState<IProjectEntity[]>([]);
	// const [selectedTokens, setSelectedTokens] = useState<ITokenEntity[]>([]);
	// const [selectedNonPinnedTokens, setSelectedNonPinnedTokens] = useState<ITokenEntity | IDebankProtocol[]>([]);
	// const [selectedDebankProtocols, setSelectedDebankProtocols] = useState<IDebankProtocol[]>([]);

	const [tokenIds, setTokenIds] = useState<string[]>([]);

	useEffect(() => {
		fetchTokens();
		fetchNonPinnedTokens();
		fetchProjects();
		fetchDebankProtocols();
	}, []);

	async function deleteProjects() {
		let query = '';
		for (let i = 0; i < selectedProjects.length; i++) {
			const append = i === 0 ? '?' : '&';
			query += append + 'id=' + encodeURIComponent(selectedProjects[i].id);
		}
		await fetch(`${BASE_URL}/projects${query}`, { method: 'delete' });
		setSelectedProjects([]);
		await fetchProjects();
	}

	async function fetchProjects(page = 1) {
		const response = await fetch(
			`${BASE_URL}/projects?query=` + encodeURIComponent(projectQuery) + `&page=${page}`,
		);
		const { data } = await response.json();
		setProjects(data);
		// setSelectedProjects([]);
	}

	async function fetchDebankProtocols(page = 1) {
		const response = await fetch(
			`${BASE_URL}/debank-protocols?query=` + encodeURIComponent(debankQuery) + `&page=${page}`,
		);
		const { data } = await response.json();
		setDebankProtocols(data);
		// setSelectedProjects([]);
	}

	async function fetchNonPinnedTokens(page = 1) {
		const response = await fetch(
			`${BASE_URL}/non-pinned-tokens?query=` + encodeURIComponent(tokenQuery) + `&page=${page}`,
		);
		const { data } = await response.json();
		setNonPinnedTokens(data);
	}

	async function fetchTokens(page = 1) {
		const response = await fetch(`${BASE_URL}/tokens?query=` + encodeURIComponent(tokenQuery) + `&page=${page}`);
		const { data } = await response.json();
		setTokens(data);
	}

	async function smartGuessToken(id: string) {
		const response = await fetch(`${BASE_URL}/smart-guess-token?token=` + encodeURIComponent(id));
		const result = await response.json();
		if (result.result) {
			// setSelectedTokens([token]);
			setTokenIds([id]);
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

	async function attachTokensToProject() {
		if (tokenIds.length === 0) {
			return;
		}
		const response = await fetch(`${BASE_URL}/pin-token-to-project`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				projectId: selectedProjects[0].id,
				tokens: tokenIds,
			}),
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

	function renderTab() {
		switch (tab) {
			case 'non-pinned-tokens':
				return <TabNonPinnedTokens />;
			case 'projects':
				return <TabProjects />;
			case 'debank-protocols':
				return <TabDebankProtocols />;
			case 'tokens':
				return <TabTokens />;
			default:
				<></>;
		}
	}

	function showAmount<T>(p: Paginator<T>) {
		return p.items.length + ' / ' + p.totalCount;
	}

	return (
		<DataContext.Provider
			value={{
				tokens,
				tokenQuery,
				setTokenQuery,
				fetchTokens,
				// selectedTokens,
				// setSelectedTokens,
				fetchNonPinnedTokens,
				nonPinnedTokens,
				smartGuessToken,
				selectedProjects,
				setSelectedProjects,
				projectQuery,
				setProjectQuery,
				projects,
				fetchProjects,
				debankProtocols,
				// selectedDebankProtocols,
				setDebankQuery,
				// setSelectedDebankProtocols,
				debankQuery,
				fetchDebankProtocols,
				nonPinnedTokenQuery,
				setNonPinnedTokenQuery,
				// setSelectedNonPinnedTokens,
				tokenIds,
				setTokenIds,
			}}
		>
			{guessData ? (
				<GuessProjectModal
					token={tokenIds[0]}
					guessData={guessData}
					onClose={refresh => {
						setGuessData('');
						if (refresh) {
							setTokenIds([]);
							setTokenQuery('');
							setNonPinnedTokenQuery('');
							setProjectQuery('');
							setDebankQuery('');
							fetchTokens();
							fetchNonPinnedTokens();
							fetchProjects();
							fetchDebankProtocols();
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
					<Button onClick={doCreateProject} disabled={false} text={'Create project'} />
					<Button onClick={doMergeProjects} disabled={isMergeDisabled} text={'Merge projects'} />
					<Button
						onClick={deleteProjects}
						disabled={selectedProjects.length === 0}
						text={'Delete Projects'}
					/>
					<Button
						onClick={attachTokensToProject}
						disabled={selectedProjects.length !== 1 || tokenIds.length === 0}
						text={'Attach tokens / protocols'}
					/>
				</div>
				<div>
					<button
						style={{
							background: tab === 'non-pinned-tokens' ? 'black' : 'transparent',
							color: tab === 'non-pinned-tokens' ? 'white' : 'black',
							border: '1px solid black',
							padding: '5px 10px',
							margin: 5,
							borderRadius: 20,
						}}
						onClick={() => setTab('non-pinned-tokens')}
					>
						Non Pinned Tokens / Protocols ({showAmount(nonPinnedTokens)})
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
						Our projects ({showAmount(projects)})
					</button>
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
						Tokens ({showAmount(tokens)})
					</button>
					<button
						style={{
							background: tab === 'debank-protocols' ? 'black' : 'transparent',
							color: tab === 'debank-protocols' ? 'white' : 'black',
							border: '1px solid black',
							padding: '5px 10px',
							margin: 5,
							borderRadius: 20,
						}}
						onClick={() => setTab('debank-protocols')}
					>
						Debank protocols ({showAmount(debankProtocols)})
					</button>
				</div>
				<p>
					Selected our projects ({selectedProjects.length}): {selectedProjects.map(p => p.id).join(', ')}
					<p>
						<button onClick={() => setSelectedProjects([])} style={{ border: '1px solid black' }}>
							Reset
						</button>
					</p>
				</p>
				<p>
					Selected tokens / protocols ({tokenIds.length}): {tokenIds.join(', ')}
					<p>
						<button onClick={() => setTokenIds([])} style={{ border: '1px solid black' }}>
							Reset
						</button>
					</p>
				</p>
				{renderTab()}
			</div>
		</DataContext.Provider>
	);
};

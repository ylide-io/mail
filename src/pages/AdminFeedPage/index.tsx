import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import React, { RefObject } from 'react';
import { PureComponent, Ref } from 'react';

export interface IProjectEntity {
	id: string;
	slug: string;
	name: string;
	logo: string | null;
	meta: any;
}

const scanners: Record<string, string> = {
	cro: 'https://cronoscan.com',
	eth: 'https://etherscan.io',
	bsc: 'https://bscscan.com',
	arb: 'https://arbiscan.io',
	avax: 'https://snowtrace.io',
	op: 'https://optimistic.etherscan.io',
	matic: 'https://polygonscan.com',
	ftm: 'https://ftmscan.com',
	klay: 'https://scope.klaytn.com',
	xdai: 'https://gnosisscan.io',
	aurora: 'https://aurorascan.dev',
	celo: 'https://celoscan.io',
	mobm: 'https://moonbeam.moonscan.io',
	movr: 'https://moonriver.moonscan.io',
	metis: 'https://andromeda-explorer.metis.io',
	astar: 'https://astar.subscan.io',
};

const baseUrl = 'http://localhost:8271'; // 'https://fm-api.ylide.io';

@observer
class GuessProjectModal extends PureComponent<{
	token: string;
	guessData: string | null;
	onClose: (refresh: boolean) => void;
}> {
	@observable selectedProjectId: string | null = null;
	@observable debankResult: any = null;
	@observable debankId: string = '';
	@observable projectQuery: string = '';

	ref = React.createRef<HTMLDivElement>();

	@observable projects: IProjectEntity[] = [];

	constructor(props: any) {
		super(props);

		makeObservable(this);
	}

	async getDebankProject(query: string) {
		const res = await fetch(`${baseUrl}/debank-project?id=${query}`);
		const data = await res.json();
		this.debankResult = data;
		this.ref.current!.scrollTo(0, 10000);
	}

	async getDebankToken(chain: string, id: string) {
		const res = await fetch(`${baseUrl}/debank-token?chain=${chain}&id=${id}`);
		const data = await res.json();
		this.debankResult = data;
		this.ref.current!.scrollTo(0, 10000);
	}

	async getProjects(query: string) {
		const res = await fetch(`${baseUrl}/projects?query=${query}`);
		const data = await res.json();
		this.projects = data;
	}

	async attachTokenToProject(token: string, pid: string) {
		const response = await fetch(`${baseUrl}/pin-token-to-project`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ projectId: pid, token }),
		});
		const result = await response.json();
		alert(JSON.stringify(result));
		if (result.success) {
			this.props.onClose(true);
		}
	}

	render() {
		const { token, guessData, onClose } = this.props;

		return (
			<div
				style={{
					position: 'fixed',
					width: '90vw',
					height: '90vh',
					padding: 10,
					backgroundColor: 'white',
					border: '1px solid black',
					top: '50%',
					left: '50%',
					marginTop: '-45vh',
					marginLeft: '-45vw',
					boxShadow: '0 0 10px rgba(0,0,0,0.5)',
					borderRadius: 10,
					overflow: 'hidden',
				}}
			>
				<style>
					{`.sel-prj:hover {
						cursor: pointer;
						background-color: #ffffff;
					}`}
				</style>
				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-start',
						alignItems: 'stretch',
						flexDirection: 'column',
						width: '100%',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-start',
							alignItems: 'stretch',
							flexDirection: 'row',
							flexGrow: 0,
							flexShrink: 0,
						}}
					>
						<a
							href="#"
							onClick={e => {
								e.preventDefault();
								onClose(false);
							}}
						>
							Close
						</a>
						&nbsp;&nbsp;&nbsp;&nbsp;
						{token}{' '}
						<a
							href="#"
							onClick={e => {
								e.preventDefault();
								const [chain, ...rest] = token.split(':');
								const id = rest.join(':');
								this.getDebankToken(chain, id);
							}}
						>
							Get debank data
						</a>
					</div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-start',
							alignItems: 'stretch',
							flexDirection: 'row',
							flexGrow: 1,
							flexShrink: 1,
							maxHeight: '80vh',
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'flex-start',
								alignItems: 'flex-start',
								flexDirection: 'column',
								flexGrow: 1,
								flexShrink: 1,
								overflow: 'auto',
							}}
							ref={this.ref}
						>
							<pre>{guessData}</pre>
							<input
								type="text"
								style={{ border: '1px solid #e0e0e0', margin: 10 }}
								value={this.debankId}
								onChange={e => (this.debankId = e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										e.preventDefault();
										e.stopPropagation();
										this.getDebankProject(this.debankId);
									}
								}}
							/>
							{this.debankResult && (
								<div>
									<h3>Debank result</h3>
									<pre>{JSON.stringify(this.debankResult, null, 2)}</pre>
								</div>
							)}
						</div>
						<div
							style={{
								display: 'flex',
								justifyContent: 'flex-start',
								alignItems: 'flex-start',
								flexDirection: 'column',
								flexGrow: 0,
								flexShrink: 0,
								flexBasis: 300,
								backgroundColor: '#e0e0e0',
								overflow: 'auto',
							}}
						>
							<input
								type="text"
								value={this.projectQuery}
								style={{ border: '1px solid #e0e0e0', margin: 10, backgroundColor: 'white' }}
								onChange={e => (this.projectQuery = e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										e.preventDefault();
										e.stopPropagation();
										this.getProjects(this.projectQuery);
									}
								}}
							/>
							<br />
							<div
								style={{
									display: 'flex',
									justifyContent: 'flex-start',
									alignItems: 'stretch',
									flexDirection: 'column',
								}}
							>
								{this.projects.map(p => (
									<div
										key={p.id}
										className="sel-prj"
										onClick={e => {
											e.preventDefault();
											this.selectedProjectId = p.id;
										}}
										style={{
											display: 'flex',
											justifyContent: 'flex-start',
											alignItems: 'stretch',
											flexDirection: 'row',
											flexGrow: 0,
											flexShrink: 0,
											padding: 10,
											borderBottom: '1px solid #e0e0e0',
										}}
									>
										{p.name}
										&nbsp;
										{this.selectedProjectId === p.id ? (
											<a
												href="#"
												onClick={e => {
													e.preventDefault();
													this.attachTokenToProject(token, p.id);
												}}
											>
												Confirm
											</a>
										) : null}
									</div>
								))}
							</div>
						</div>
					</div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-start',
							alignItems: 'flex-start',
							flexDirection: 'column',
							flexGrow: 0,
							flexShrink: 0,
						}}
					>
						footer
					</div>
				</div>
			</div>
		);
	}
}

@observer
export class AdminFeedPage extends PureComponent<{}> {
	@observable projects: IProjectEntity[] = [];
	@observable tokens: string[] = [];
	@observable tab: 'tokens' | 'projects' = 'tokens'; //projects

	@observable selectedProjectIds: string[] = [];
	@observable selectedToken: string | null = null;
	@observable guessData: string | null = null;

	mouseDown = false;
	idxStart: number = -1;
	idxEnd: number = -1;

	constructor(props: {}) {
		super(props);

		makeObservable(this);
	}

	async componentDidMount() {
		await this.fetchNonPinnedTokens();
		await this.fetchProjects();
	}

	async fetchProjects(query: string = '') {
		const response = await fetch(`${baseUrl}/projects?query=` + encodeURIComponent(query));
		const projects = await response.json();
		this.projects = projects;
		this.selectedProjectIds = [];
	}

	async fetchNonPinnedTokens() {
		const response = await fetch(`${baseUrl}/non-pinned-tokens`);
		const tokens = await response.json();
		this.tokens = tokens;
	}

	async smartGuessToken(token: string) {
		const response = await fetch(`${baseUrl}/smart-guess-token?token=` + encodeURIComponent(token));
		const result = await response.json();
		if (result.success) {
			this.selectedToken = token;
			this.guessData = JSON.stringify(result.datas, null, '  ');
			// await this.fetchNonPinnedTokens();
		}
	}

	async mergeProjects(projectIds: string[]) {
		const firstProject = this.projects.find(p => p.id === projectIds[0]);
		const newName = prompt('New name: ', firstProject?.name);
		if (!newName) return;
		const response = await fetch(`${baseUrl}/merge-projects`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ projectIds, newName }),
		});
		const result = await response.json();
		if (result.success) {
			await this.fetchProjects();
		}
	}

	async doMergeProjects() {
		if (this.selectedProjectIds.length < 2) return;
		await this.mergeProjects(this.selectedProjectIds);
	}

	async attachTokenToProject(projectId: string, token: string) {
		const response = await fetch(`${baseUrl}/pin-token-to-project`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ projectId, token }),
		});
		const result = await response.json();
		return result.success;
	}

	async createProject(data: { name: string; logo: string | null; meta: any; slug: string }) {
		const response = await fetch(`${baseUrl}/create-project`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});
		const result = await response.json();
		return result.success;
	}

	async doCreateProject() {
		const name = prompt('Name');
		if (!name) return;
		await this.createProject({
			name: name || '',
			logo: null,
			meta: {},
			slug: name.toLowerCase().replaceAll(/\s/g, '-'),
		});
		await this.fetchProjects();
	}

	render() {
		return (
			<>
				{this.guessData ? (
					<GuessProjectModal
						token={this.selectedToken!}
						guessData={this.guessData}
						onClose={refresh => {
							this.guessData = null;
							if (refresh) {
								this.fetchNonPinnedTokens();
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
						<button
							style={{ border: '1px solid black', padding: '5px 10px', margin: 5, borderRadius: 20 }}
							onClick={() => this.fetchNonPinnedTokens()}
						>
							Refresh
						</button>
						<button
							style={{ border: '1px solid black', padding: '5px 10px', margin: 5, borderRadius: 20 }}
							onClick={() => this.doCreateProject()}
						>
							Create project
						</button>
						<button
							style={{ border: '1px solid black', padding: '5px 10px', margin: 5, borderRadius: 20 }}
							onClick={() => this.doMergeProjects()}
						>
							Merge projects
						</button>
					</div>
					<div>
						<button
							style={{
								background: this.tab === 'tokens' ? 'black' : 'transparent',
								color: this.tab === 'tokens' ? 'white' : 'black',
								border: '1px solid black',
								padding: '5px 10px',
								margin: 5,
								borderRadius: 20,
							}}
							onClick={() => (this.tab = 'tokens')}
						>
							Non-pinned tokens{this.tokens ? ` (${this.tokens.length})` : ''}
						</button>
						<button
							style={{
								background: this.tab === 'projects' ? 'black' : 'transparent',
								color: this.tab === 'projects' ? 'white' : 'black',
								border: '1px solid black',
								padding: '5px 10px',
								margin: 5,
								borderRadius: 20,
							}}
							onClick={() => (this.tab = 'projects')}
						>
							Projects
						</button>
					</div>
					{this.tab === 'tokens' ? (
						<table>
							<thead>
								<tr>
									<th>Token</th>
									<th>Scan</th>
									<th>Smart guess</th>
									<th>Attach</th>
								</tr>
							</thead>
							<tbody>
								{this.tokens.map((token, index) => (
									<tr key={index}>
										<td>{token}</td>
										<td>
											<a
												href={
													scanners[token.split(':')[0]] +
													'/address/' +
													token.split(':').slice(1).join(':') +
													'#code'
												}
												target="_blank"
												rel="noreferrer"
											>
												{token}
											</a>
										</td>
										<td>
											<a
												href="#"
												onClick={e => {
													e.preventDefault();
													this.smartGuessToken(token);
												}}
											>
												Extract data
											</a>
										</td>
										<td>Select project</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<table style={{ userSelect: 'none' }}>
							<thead>
								<tr>
									<th> </th>
									<th>Projects</th>
									<th>Associated tokens</th>
									<th>Smth</th>
								</tr>
							</thead>
							<tbody>
								{this.projects.map((project, index) => (
									<tr
										key={index}
										onMouseMove={e => {
											if (this.mouseDown) {
												this.idxEnd = index;
												if (Math.abs(this.idxStart - this.idxEnd) > 1) {
													const newIds: string[] = [];
													for (
														let i = Math.min(this.idxStart, this.idxEnd);
														i <= Math.max(this.idxStart, this.idxEnd);
														i++
													) {
														newIds.push(this.projects[i].id);
													}
													this.selectedProjectIds = newIds;
												} else {
													this.selectedProjectIds = [project.id];
												}
											}
										}}
										onMouseUp={e => {
											this.mouseDown = false;
											if (Math.abs(this.idxStart - this.idxEnd) > 1) {
												const newIds: string[] = [];
												for (
													let i = Math.min(this.idxStart, this.idxEnd);
													i <= Math.max(this.idxStart, this.idxEnd);
													i++
												) {
													newIds.push(this.projects[i].id);
												}
												this.selectedProjectIds = newIds;
											} else {
												this.selectedProjectIds = [project.id];
											}
										}}
									>
										<td>
											<input
												onMouseDown={e => {
													e.stopPropagation();
													this.mouseDown = true;
													this.idxStart = index;
													this.idxEnd = index;
												}}
												style={{ appearance: 'auto' }}
												type="checkbox"
												checked={this.selectedProjectIds.includes(project.id)}
												// onChange={e => {
												// 	if (e.target.checked) {
												// 		this.selectedProjectIds.push(project.id);
												// 	} else {
												// 		this.selectedProjectIds = this.selectedProjectIds.filter(
												// 			id => id !== project.id,
												// 		);
												// 	}
												// }}
											/>
										</td>
										<td>{project.name}</td>
										<td>Will be here...</td>
										<td>Smth</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</>
		);
	}
}

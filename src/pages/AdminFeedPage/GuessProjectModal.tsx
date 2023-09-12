import { useState } from 'react';

import { BASE_URL, DEFAULT_PAGINATOR } from './constants';
import { IProjectEntity, Paginator } from './types';

type Props = {
	token: string;
	guessData: string | null;
	onClose: (refresh: boolean) => void;
};

export const GuessProjectModal = ({ token, guessData, onClose }: Props) => {
	const [selectedProjectId, setSelectedProjectId] = useState<string>('');
	const [debankResult, setDebankResult] = useState<any>(null);
	const [debankId, setDebankId] = useState('');
	const [projectQuery, setProjectQuery] = useState('');
	const [projects, setProjects] = useState<Paginator<IProjectEntity>>(DEFAULT_PAGINATOR);

	async function getDebankProject(query: string) {
		const res = await fetch(`${BASE_URL}/debank-project?id=${query}`);
		const data = await res.json();
		setDebankResult(data);
	}

	async function getDebankToken(chain: string, id: string) {
		const res = await fetch(`${BASE_URL}/debank-token?chain=${chain}&id=${id}`);
		const data = await res.json();
		setDebankResult(data);
	}

	async function getProjects(query: string) {
		const res = await fetch(`${BASE_URL}/projects?query=${query}`);
		const { data } = await res.json();
		setProjects(data);
	}

	async function attachTokenToProject(token: string, pid: string) {
		const response = await fetch(`${BASE_URL}/pin-token-to-project`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ projectId: pid, token }),
		});
		const result = await response.json();
		alert(JSON.stringify(result));
		if (result.success) {
			onClose(true);
		}
	}

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
							getDebankToken(chain, id);
						}}
					>
						Get debank data
					</a>
					{debankResult && (
						<div>
							<h3>Debank result</h3>
							<pre>{JSON.stringify(debankResult, null, 2)}</pre>
						</div>
					)}
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
					>
						<pre>{guessData}</pre>
						<input
							type="text"
							style={{ border: '1px solid #e0e0e0', margin: 10 }}
							value={debankId}
							onChange={e => setDebankId(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									e.preventDefault();
									e.stopPropagation();
									getDebankProject(debankId);
								}
							}}
						/>
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
							value={projectQuery}
							style={{ border: '1px solid #e0e0e0', margin: 10, backgroundColor: 'white' }}
							onChange={e => setProjectQuery(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									e.preventDefault();
									e.stopPropagation();
									getProjects(projectQuery);
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
							{projects.items.map(p => (
								<div
									key={p.id}
									className="sel-prj"
									onClick={e => {
										e.preventDefault();
										setSelectedProjectId(p.id);
									}}
									style={{
										display: 'flex',
										justifyContent: 'flex-start',
										alignItems: 'stretch',
										flexDirection: 'column',
										flexGrow: 0,
										flexShrink: 0,
										padding: 10,
										borderBottom: '1px solid #e0e0e0',
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
											marginBottom: 4,
										}}
									>
										{p.name}
										&nbsp;
										{selectedProjectId === p.id ? (
											<a
												href="#"
												onClick={e => {
													e.preventDefault();
													attachTokenToProject(token, p.id);
												}}
											>
												Confirm
											</a>
										) : null}
									</div>
									<div
										style={{
											display: 'flex',
											justifyContent: 'flex-start',
											alignItems: 'stretch',
											flexDirection: 'row',
											flexGrow: 0,
											flexShrink: 0,
											padding: 5,
											fontSize: 10,
											borderBottom: '1px solid #e0e0e0',
										}}
									>
										{p.meta?.coingecko?.links?.homepage}
										<br />
										{JSON.stringify(p.meta?.coingecko)}
									</div>
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
};

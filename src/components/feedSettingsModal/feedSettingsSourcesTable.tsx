import clsx from 'clsx';
import { computed, makeObservable, observable, runInAction, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { CSSProperties, PureComponent } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';

import { LinkType } from '../../api/feedServerApi';
import { ReactComponent as ContactSvg } from '../../icons/ic20/contact.svg';
import { FeedLinkTypeIcon } from '../../pages/feed/_common/feedLinkTypeIcon/feedLinkTypeIcon';
import { ProjectRelation, ProjectRelationOrEmpty } from '../../shared/PortfolioScope';
import domain from '../../stores/Domain';
import { getReasonOrder } from '../../stores/FeedSettings';
import { LocalFeedSettings } from '../../stores/LocalFeedSettings';
import { blockchainNames } from '../../utils/blockchainNames';
import { formatNumberExt, formatUsdExt } from '../../utils/formatUsdExt';
import { Avatar } from '../avatar/avatar';
import { CheckBox, CheckBoxSize } from '../checkBox/checkBox';
import { SimplePopup } from '../simplePopup/simplePopup';
import css from './feedSettingsModal.module.scss';

interface FeedReasonLabelProps {
	projectId: number;
	fs: LocalFeedSettings;
}

@observer
export class FeedReasonLabel extends PureComponent<FeedReasonLabelProps> {
	renderPopupContent() {
		const { fs, projectId } = this.props;
		const meta = fs.portfolio.projectToPortfolioMetaMap[projectId];
		const portfolioSources = fs.portfolioSources;

		if (meta?.exposure) {
			return (
				<div className={css.balancePopup}>
					{portfolioSources
						.map((s, idx) => ({
							portfolioSource: s,
							portfolioSourceExposureData: meta.exposure!.exposurePerPortfolioSource[idx],
						}))
						.filter(s => s.portfolioSourceExposureData.total > 0)
						.map(s => (
							<div className={css.balanceBlock} key={s.portfolioSource.id}>
								{portfolioSources.length > 1 && (
									<div className={css.balanceTitle}>{s.portfolioSource.id}</div>
								)}
								<table className={css.balanceTable}>
									<thead>
										<tr>
											<th className={clsx(css.bthValue, css.btValue)}>Value</th>
											<th className={clsx(css.bthToken, css.btToken)}>Token</th>
											<th className={clsx(css.bthChain, css.btChain)}>Chain</th>
											<th className={clsx(css.bthProject, css.btProject)}>Where</th>
										</tr>
									</thead>
									<tbody>
										{s.portfolioSourceExposureData.entries.map((entry, idx) => (
											<tr className={css.balanceRow} key={idx}>
												<td className={clsx(css.btdValue, css.btValue)}>
													{formatUsdExt(entry.leftValueUsd)}
												</td>
												<td className={clsx(css.btdToken, css.btToken)}>{entry.left.symbol}</td>
												<td className={clsx(css.btdChain, css.btChain)}>
													{entry.right
														? blockchainNames[entry.right.id.split(':')[0]] ||
														  entry.right.id.split(':')[0]
														: blockchainNames[entry.left.id.split(':')[0]] ||
														  entry.left.id.split(':')[0]}
												</td>
												<td className={clsx(css.btdProject, css.btProject)}>
													{entry.right ? `in protocol` : 'on balance'}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						))}
				</div>
			);
		} else {
			return null;
		}
	}

	renderValue() {
		const { fs, projectId } = this.props;
		const meta = fs.portfolio.projectToPortfolioMetaMap[projectId];

		const isSel = fs.activeProjectIds.includes(projectId);

		if (!meta) {
			return null;
		} else {
			if (meta.relation === ProjectRelation.ACTIVE_EXPOSURE) {
				return (
					<div className={css.exposureLabel}>
						<div className={clsx(css.exposureValue, !isSel && css.badValue)}>
							{formatUsdExt(meta.exposure!.exposure)}
						</div>
						<div className={clsx(css.exposurePercent, !isSel && css.badValue)}>
							{formatNumberExt(meta.exposure!.exposurePercentage * 100)}%
						</div>
					</div>
				);
			}
		}
	}

	render() {
		const value = this.renderValue();

		if (value) {
			const content = this.renderPopupContent();
			return <SimplePopup content={content}>{value}</SimplePopup>;
		} else {
			return value;
		}
	}
}

interface FeedSourcesTableProps {
	searchTerm: string;
	fs: LocalFeedSettings;
}

const FeedSourcesRow = (fs: LocalFeedSettings) =>
	observer(({ index, data, style }: { index: number; data: string[]; style: CSSProperties }) => {
		const [rowType, second, third] = data[index].split(':');

		if (rowType === 'reason') {
			const reason = second as ProjectRelationOrEmpty;
			return (
				<div className={css.category} key={`row-${index}`} style={style}>
					<CheckBox
						isChecked={true} // sourcesByReason[reason].every(s => selectedSourceIds.includes(s.id))
						onChange={isChecked => {
							// const newSourceIds = selectedSourceIds.filter(
							// 	id => !sourcesByReason[reason].find(s => typeof s !== 'string' && s.id === id),
							// );
							// console.log(selectedSourceIds);
							// console.log(newSourceIds);
							// setSelectedSourceIds(
							// 	isChecked
							// 		? [...newSourceIds, ...sourcesByReason[reason].map(s => s.id)]
							// 		: newSourceIds,
							// );
						}}
					/>
					<div className={css.categoryReason}>
						{reason
							? {
									[ProjectRelation.ACTIVE_EXPOSURE]: `Projects you're exposed to`,
									[ProjectRelation.INTERACTED]: `Projects you've had interacted with`,
							  }[reason]
							: 'Others'}
					</div>
					<div className={css.categoryProject}>Your exposure</div>
				</div>
			);
		} else if (rowType === 'project') {
			const projectId = Number(second);
			const project = domain.feedSources.projectsMap.get(projectId);
			const projectSources = domain.feedSources.sourcesByProjectId.get(projectId);
			const sourceAvatar = projectSources ? projectSources.find(s => s.avatar)?.avatar : undefined;
			const isChecked = projectSources ? projectSources.some(s => fs.activeSourceIds.has(s.id)) : false;

			return (
				<div
					key={`row-${index}`}
					className={clsx(css.row, css.project_row, css.row_data, !isChecked && css.badRow)}
					style={style}
				>
					<CheckBox
						isChecked={isChecked}
						onChange={v => {
							runInAction(() => {
								if (!projectSources) {
									return;
								}
								if (v) {
									for (const source of projectSources) {
										fs.excludeSourceIds.delete(source.id);
										if (!fs.defaultActiveSourceIds.has(source.id)) {
											fs.includeSourceIds.add(source.id);
										}
									}
								} else {
									for (const source of projectSources) {
										fs.includeSourceIds.delete(source.id);
										if (fs.defaultActiveSourceIds.has(source.id)) {
											fs.excludeSourceIds.add(source.id);
										}
									}
								}
							});
						}}
					/>

					<div className={css.projectName}>
						<Avatar image={sourceAvatar} placeholder={<ContactSvg width="100%" height="100%" />} />

						<div className={css.projectNameText}>{project?.name || 'Unknown'}</div>
					</div>

					<div className={css.categoryProject}>
						<FeedReasonLabel projectId={projectId} fs={fs} />
					</div>
				</div>
			);
		} else if (rowType === 'source') {
			const projectId = Number(second);
			const sourceId = Number(third);
			const projectSources = domain.feedSources.sourcesByProjectId.get(projectId) || [];
			const source = domain.feedSources.sourcesMap.get(sourceId);

			if (!source) {
				return null;
			}

			const isSel = fs.activeProjectIds.includes(projectId);

			return (
				<div
					key={`row-${index}-${source.id}`}
					className={clsx(css.row, css.source_row, css.row_data, !isSel && css.badRow)}
					style={style}
				>
					<CheckBox
						size={CheckBoxSize.SMALL}
						isChecked={fs.activeSourceIds.has(sourceId)}
						onChange={v => {
							if (v) {
								fs.excludeSourceIds.delete(source.id);
								if (!fs.defaultActiveSourceIds.has(source.id)) {
									fs.includeSourceIds.add(source.id);
								}
							} else {
								fs.includeSourceIds.delete(source.id);
								if (fs.defaultActiveSourceIds.has(source.id)) {
									fs.excludeSourceIds.add(source.id);
								}
							}
						}}
					/>

					<div className={css.sourceName}>
						<FeedLinkTypeIcon className={css.sourceLogo} size={15} linkType={source.type} />

						<div className={css.sourceNameText}>
							{
								{
									[LinkType.TELEGRAM]: 'Telegram',
									[LinkType.TWITTER]: 'Twitter',
									[LinkType.MEDIUM]: 'Medium',
									[LinkType.MIRROR]: 'Mirror',
									[LinkType.DISCORD]: 'Discord',
								}[source.type]
							}
							{(() => {
								if (
									source.type === LinkType.DISCORD &&
									projectSources.filter(s => s.type === LinkType.DISCORD).length > 1
								) {
									return ` channel "${source.name}"`;
								}
							})()}
							{(() => {
								const w = (v: string) => (
									<div className={css.sourceLink}>
										(
										<a href={source.link} target="_blank" rel="noreferrer">
											{v}
										</a>
										)
									</div>
								);
								if (source.type === LinkType.TWITTER) {
									return w('@' + source.origin || '');
								} else if (source.type === LinkType.TELEGRAM) {
									return w('@' + source.origin || '');
								} else if (source.type === LinkType.MIRROR) {
									return w(
										source.link
											.replace('https://', '')
											.replace('http://', '')
											.replace(/\.mirror\.xyz\/$/, '.mirror.xyz'),
									);
								} else if (source.type === LinkType.DISCORD) {
									const md = projectSources.filter(s => s.type === LinkType.DISCORD).length > 1;
									if (md) {
										return w('link');
									} else {
										return w(source.origin || 'link');
									}
								}
								return null;
							})()}
						</div>
					</div>
				</div>
			);
		} else {
			return null;
		}
	});

@observer
export class FeedSourcesTable extends PureComponent<FeedSourcesTableProps> {
	@observable.shallow Row = FeedSourcesRow(this.props.fs);
	listRef: VariableSizeList | null = null;

	@observable searchTerm = this.props.searchTerm;

	constructor(props: FeedSourcesTableProps) {
		super(props);

		makeObservable(this);
	}

	@computed get rows() {
		const {
			props: {
				fs: { groups },
			},
			searchTerm,
		} = this;

		const stlc = searchTerm.toLowerCase();

		const rows: string[] = [];
		getReasonOrder(Object.keys(groups) as ProjectRelationOrEmpty[]).forEach(reason => {
			if (groups[reason].length) {
				const projectsRows = groups[reason].filter(projectId => {
					const name = domain.feedSources.projectsMap.get(projectId)?.name || '';
					return name.toLowerCase().includes(stlc);
				});
				if (projectsRows.length) {
					rows.push('reason:' + reason);
					projectsRows.forEach(projectId => {
						rows.push('project:' + projectId);
						const projectSources = domain.feedSources.sourcesByProjectId.get(projectId) || [];
						projectSources.forEach(source => {
							rows.push('source:' + projectId + ':' + source.id);
						});
					});
				}
			}
		});

		return rows;
	}

	componentDidUpdate(prevProps: Readonly<FeedSourcesTableProps>, prevState: Readonly<{}>, snapshot?: any): void {
		if (prevProps.fs !== this.props.fs) {
			this.Row = FeedSourcesRow(this.props.fs);
		}
		if (prevProps.searchTerm !== this.props.searchTerm) {
			this.searchTerm = this.props.searchTerm;
		}
	}

	render() {
		const rows = toJS(this.rows);
		return (
			<div className={css.listInner}>
				<AutoSizer>
					{({ width, height }) => (
						<VariableSizeList
							ref={ref => (this.listRef = ref)}
							width={width}
							height={height}
							itemSize={idx => (rows[idx].startsWith('source') ? 24 : 40)}
							itemCount={rows.length}
							itemData={rows}
							overscanCount={20}
						>
							{this.Row}
						</VariableSizeList>
					)}
				</AutoSizer>
			</div>
		);
	}
}

import clsx from 'clsx';
import { computed, makeObservable, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { CSSProperties, PureComponent } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';

import { LinkType } from '../../api/feedServerApi';
import { ReactComponent as ContactSvg } from '../../icons/ic20/contact.svg';
import { FeedLinkTypeIcon } from '../../pages/feed/_common/feedLinkTypeIcon/feedLinkTypeIcon';
import { ProjectRelation, ProjectRelationOrEmpty } from '../../shared/PortfolioScope';
import domain from '../../stores/Domain';
import { FeedSettings } from '../../stores/FeedSettings';
import { getReasonOrder } from '../../stores/FeedsRepository';
import { formatNumberExt, formatUsdExt } from '../../utils/formatUsdExt';
import { Avatar } from '../avatar/avatar';
import { CheckBox, CheckBoxSize } from '../checkBox/checkBox';
import { SimplePopup } from '../simplePopup/simplePopup';
import css from './feedSettingsModal.module.scss';
import { ProjectExposureTable } from './projectExposureTable';

interface FeedReasonLabelProps {
	projectId: number;
	fs: FeedSettings;
}

@observer
export class FeedReasonLabel extends PureComponent<FeedReasonLabelProps> {
	renderPopupContent() {
		return (
			<ProjectExposureTable
				portfolio={this.props.fs.portfolio}
				portfolioSources={this.props.fs.portfolioSources}
				projectId={this.props.projectId}
			/>
		);
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
	fs: FeedSettings;
}

const FeedSourcesRow = (fs: FeedSettings) =>
	observer(({ index, data, style }: { index: number; data: string[]; style: CSSProperties }) => {
		const [rowType, second, third] = data[index].split(':');

		if (rowType === 'reason') {
			const reason = second as ProjectRelationOrEmpty;
			return (
				<div className={css.category} key={`row-${index}`} style={style}>
					<CheckBox
						isChecked={fs.groups[reason].some(projectId => {
							const projectSources = domain.feedSources.sourcesByProjectId.get(projectId);
							return projectSources ? projectSources.some(s => fs.activeSourceIds.has(s.id)) : false;
						})}
						onChange={v => {
							if (v) {
								fs.activateProjects(fs.groups[reason]);
							} else {
								fs.deactivateProjects(fs.groups[reason]);
							}
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
					<div className={css.categoryProject}>
						{reason
							? {
									[ProjectRelation.ACTIVE_EXPOSURE]: `Your exposure`,
									[ProjectRelation.INTERACTED]: `Your interactions`,
							  }[reason]
							: ''}
					</div>
				</div>
			);
		} else if (rowType === 'project') {
			const projectId = Number(second);
			const project = domain.feedSources.projectsMap.get(projectId);
			const projectSources = domain.feedSources.sourcesByProjectId.get(projectId);

			// const sourceAvatar = projectSources ? projectSources.find(s => s.avatar)?.avatar : undefined;
			const projectLogo = project?.logoUrl || null;

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
							if (v) {
								fs.activateProject(projectId);
							} else {
								fs.deactivateProject(projectId);
							}
						}}
					/>

					<div className={css.projectName}>
						<Avatar
							image={projectLogo || undefined}
							placeholder={<ContactSvg width="100%" height="100%" />}
						/>
						{/* <Avatar image={sourceAvatar} placeholder={<ContactSvg width="100%" height="100%" />} /> */}

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
								fs.activateSource(source.id);
							} else {
								fs.deactivateSource(source.id);
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
				fs: { groups, activeSourceIds },
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
					if (reason === '') {
						projectsRows.sort((a, b) => {
							const aSources = domain.feedSources.sourcesByProjectId.get(a) || [];
							const bSources = domain.feedSources.sourcesByProjectId.get(b) || [];
							const aI = Number(aSources.some(s => activeSourceIds.has(s.id)));
							const bI = Number(bSources.some(s => activeSourceIds.has(s.id)));
							return bI - aI;
						});
					}
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
							overscanCount={40}
						>
							{this.Row}
						</VariableSizeList>
					)}
				</AutoSizer>
			</div>
		);
	}
}

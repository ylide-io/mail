import clsx from 'clsx';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent, ReactNode } from 'react';

import { MainviewApi } from '../../api/mainviewApi';
import {
	AffectedProjectLink,
	ComputedPortfolio,
	PortfolioScope,
	PortfolioSource,
	PortfolioSourceToAffectedProjectsMap,
	ProjectPortfolioMeta,
} from '../../shared/PortfolioScope';
import domain from '../../stores/Domain';
import { FeedSettings } from '../../stores/FeedSettings';
import { formatUsdExt } from '../../utils/formatUsdExt';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { Avatar } from '../avatar/avatar';
import { Modal } from '../modal/modal';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import css from './feedSettingsModal.module.scss';
import { FeedProject } from '../../stores/FeedSources';

interface CoverageBlockProps {
	embedded?: boolean;
	portfolio: ComputedPortfolio;
	projectIds: number[];
}

@observer
export class CoveragePlate extends PureComponent<{
	meta?: ProjectPortfolioMeta;
	project?: FeedProject;
	embedded?: boolean;
}> {
	render() {
		const { meta, project, embedded } = this.props;
		return (
			<div className={clsx(css.coverageItem, embedded && css.embedded)}>
				<div className={css.coverageItemLogo}>
					<Avatar image={project?.logoUrl || undefined} />
				</div>
				<div className={css.coverageItemData}>
					<div className={css.coverageItemTitle}>
						<span className={css.coverateItemTitleText}>
							{!project ? 'Others' : project?.name || '[Unknown]'}
						</span>
					</div>
					<div className={css.coverageItemValue}>{formatUsdExt(meta?.exposure?.exposure || 0)}</div>
				</div>
			</div>
		);
	}
}

@observer
export class CoverageBlock extends PureComponent<CoverageBlockProps> {
	render() {
		const { portfolio, projectIds, embedded } = this.props;

		return projectIds.map(projectId => {
			const meta = portfolio.projectToPortfolioMetaMap[projectId];
			const project = domain.feedSources.projectsMap.get(projectId);
			return <CoveragePlate key={projectId} embedded={embedded} meta={meta} project={project} />;
		});
	}
}

interface PortfolioCoverageBlockProps {
	embedded?: boolean;
	max?: number;
	showMore?: () => ReactNode;
	portfolioSources: PortfolioSource[];
	portfolioSourceToAffectedProjectsMap: PortfolioSourceToAffectedProjectsMap;
}

@observer
export class PortfolioCoverageBlock extends PureComponent<PortfolioCoverageBlockProps> {
	portfolio: ComputedPortfolio = PortfolioScope.compute(
		this.props.portfolioSources,
		this.props.portfolioSourceToAffectedProjectsMap,
	);

	projectIds: number[] = PortfolioScope.getProjectIds(this.portfolio, domain.feedSources);

	componentDidUpdate(
		prevProps: Readonly<PortfolioCoverageBlockProps>,
		prevState: Readonly<{}>,
		snapshot?: any,
	): void {
		this.portfolio = PortfolioScope.compute(
			this.props.portfolioSources,
			this.props.portfolioSourceToAffectedProjectsMap,
		);
		this.projectIds = PortfolioScope.getProjectIds(this.portfolio, domain.feedSources);
	}

	render() {
		const { projectIds } = this;
		const { embedded, max, showMore } = this.props;

		const finalProjectIds = max ? projectIds.slice(0, max) : projectIds;

		return (
			<div className={clsx(css.coverageBlock, embedded && css.embedded)}>
				<CoverageBlock portfolio={this.portfolio} projectIds={finalProjectIds} />
				{finalProjectIds.length < projectIds.length && showMore && showMore()}
			</div>
		);
	}
}

interface AddWalletSourceModalProps {
	fs: FeedSettings;
	close: (result?: {
		address: string;
		projects: AffectedProjectLink[];
		coverageData: MainviewApi.CoverageData[];
	}) => void;
}

@observer
export class AddWalletSourceModal extends PureComponent<AddWalletSourceModalProps> {
	static show(fs: FeedSettings) {
		return showStaticComponent<
			{ address: string; projects: AffectedProjectLink[]; coverageData: MainviewApi.CoverageData[] } | undefined
		>(resolve => <AddWalletSourceModal close={resolve} fs={fs} />);
	}

	@observable value: string = '';
	@observable loadedForAddress: string = '';
	@observable affectedProjectsMap: PortfolioSourceToAffectedProjectsMap = {};
	@observable coverageDataMap: Record<string, MainviewApi.CoverageData[]> = {};

	@observable loaded = false;
	@observable loading = false;

	@computed get data() {
		if (this.loadedForAddress && this.affectedProjectsMap[this.loadedForAddress]) {
			return this.affectedProjectsMap[this.loadedForAddress];
		} else {
			return null;
		}
	}

	handleSubmit = action(async () => {
		if (!domain.account) {
			return;
		}
		this.loading = true;
		const loadingFor = this.value.toLowerCase();
		const { portfolioSourceToAffectedProjects, portfolioSourceToCoverageData } =
			await MainviewApi.feeds.getPortfolioSourcesData({
				token: domain.session,
				reason: 'ADD_WALLET_SOURCE_MODAL',
				sources: [
					{
						type: 'wallet',
						id: loadingFor,
					},
				],
			});
		runInAction(() => {
			this.loadedForAddress = loadingFor;
			this.affectedProjectsMap = portfolioSourceToAffectedProjects;
			this.coverageDataMap = portfolioSourceToCoverageData;
			this.loaded = true;
			this.loading = false;
		});
	});

	constructor(props: AddWalletSourceModalProps) {
		super(props);

		makeObservable(this);
	}

	render() {
		return (
			<Modal
				className={clsx(css.addWalletModalRoot, this.loaded && this.data && css.addWalletLoaded)}
				onClose={() => this.props.close()}
			>
				<div className={css.addressInputBlock}>
					<input
						type="text"
						className={css.addressInput}
						placeholder="Please, enter valid Ethereum address..."
						value={this.value}
						onChange={e => (this.value = e.target.value)}
					/>
					<ActionButton
						look={this.loaded ? ActionButtonLook.DEFAULT : ActionButtonLook.PRIMARY}
						size={ActionButtonSize.SMALL}
						isLoading={this.loading}
						onClick={this.handleSubmit}
					>
						Submit
					</ActionButton>
				</div>
				<div className={css.addressPreviewBlock}>
					{this.loaded ? (
						<div className={css.addressPreviewData}>
							{this.data ? (
								<div className={css.projectsCoverageBlock}>
									<PortfolioCoverageBlock
										portfolioSources={[
											{
												id: this.loadedForAddress,
												type: 'wallet',
											},
										]}
										portfolioSourceToAffectedProjectsMap={this.affectedProjectsMap}
									/>
								</div>
							) : (
								<div className={css.projectsCoverageBlock}>
									No data found for address {this.loadedForAddress}
								</div>
							)}
							<div className={css.addressPreviewBlockFooter}>
								<ActionButton
									size={ActionButtonSize.LARGE}
									look={ActionButtonLook.PRIMARY}
									onClick={e => {
										this.props.close({
											address: this.loadedForAddress,
											projects: this.affectedProjectsMap[this.loadedForAddress],
											coverageData: this.coverageDataMap[this.loadedForAddress],
										});
									}}
								>
									Add this wallet to the feed
								</ActionButton>
							</div>
						</div>
					) : null}
				</div>
			</Modal>
		);
	}
}

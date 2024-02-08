import clsx from 'clsx';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import { MainviewApi } from '../../api/mainviewApi';
import {
	AffectedProjectLink,
	PortfolioScope,
	PortfolioSource,
	PortfolioSourceToAffectedProjectsMap,
} from '../../shared/PortfolioScope';
import domain from '../../stores/Domain';
import { FeedSettings } from '../../stores/FeedSettings';
import { formatUsdExt } from '../../utils/formatUsdExt';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { Avatar } from '../avatar/avatar';
import { Modal } from '../modal/modal';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import css from './feedSettingsModal.module.scss';

interface CoverageBlockProps {
	portfolioSources: PortfolioSource[];
	portfolioSourceToAffectedProjectsMap: PortfolioSourceToAffectedProjectsMap;
}

@observer
class CoverageBlock extends PureComponent<CoverageBlockProps> {
	portfolio = PortfolioScope.compute(this.props.portfolioSources, this.props.portfolioSourceToAffectedProjectsMap);
	projectsSort = (a: number, b: number) => {
		const aExposure = this.portfolio.projectToPortfolioMetaMap[a]?.exposure?.exposure || 0;
		const bExposure = this.portfolio.projectToPortfolioMetaMap[b]?.exposure?.exposure || 0;
		if (aExposure === bExposure) {
			const aName = domain.feedSources.projectsMap.get(a)?.name || '';
			const bName = domain.feedSources.projectsMap.get(b)?.name || '';
			return aName.localeCompare(bName);
		} else {
			return bExposure - aExposure;
		}
	};
	projectIds: number[] = Object.keys(this.portfolio.projectToPortfolioMetaMap).map(Number).sort(this.projectsSort);

	componentDidUpdate(prevProps: Readonly<CoverageBlockProps>, prevState: Readonly<{}>, snapshot?: any): void {
		this.portfolio = PortfolioScope.compute(
			this.props.portfolioSources,
			this.props.portfolioSourceToAffectedProjectsMap,
		);
		this.projectIds = Object.keys(this.portfolio.projectToPortfolioMetaMap).map(Number).sort(this.projectsSort);
	}

	render() {
		const { portfolio, projectIds } = this;

		return (
			<div className={css.coverageBlock}>
				{projectIds.map(projectId => {
					const meta = portfolio.projectToPortfolioMetaMap[projectId];
					const project = domain.feedSources.projectsMap.get(projectId);
					return (
						<div key={projectId} className={css.coverageItem}>
							<div className={css.coverageItemLogo}>
								<Avatar blockie="0x1234" />
							</div>
							<div className={css.coverageItemData}>
								<div className={css.coverageItemTitle}>
									<span className={css.coverateItemTitleText}>{project?.name || '[Unknown]'}</span>
								</div>
								<div className={css.coverageItemValue}>
									{formatUsdExt(meta?.exposure?.exposure || 0)}
								</div>
							</div>
						</div>
					);
				})}
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
									<CoverageBlock
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

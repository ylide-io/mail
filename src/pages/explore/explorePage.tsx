import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../components/ActionButton/ActionButton';
import { RegularProjectCard } from '../../components/blockchainProjectCards/regularProjectCard/regularProjectCard';
import { RichProjectCard } from '../../components/blockchainProjectCards/richProjectCard/richProjectCard';
import { RegularPageContent } from '../../components/genericLayout/content/regularPageContent/regularPageContent';
import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { PageMeta } from '../../components/pageMeta/pageMeta';
import { ReactComponent as TagSvg } from '../../icons/ic28/tag.svg';
import {
	BlockchainProjectId,
	blockchainProjects,
	BlockchainProjectTag,
	getBlockchainProjectById,
} from '../../stores/blockchainProjects/blockchainProjects';
import { openCreateCommunityForm } from '../../utils/misc';
import bannerSrc from './banner.png';
import css from './explorePage.module.scss';

export function ExplorePage() {
	function renderTagBlock(tag: BlockchainProjectTag) {
		return (
			<div>
				<div className={css.tagTitle}>
					<TagSvg />

					<div>
						{tag} <span>communities</span>
					</div>
				</div>

				<div className={css.smallGrid}>
					{blockchainProjects
						.filter(p => p.tags?.includes(tag))
						.map(project => (
							<RegularProjectCard project={project} />
						))}
				</div>
			</div>
		);
	}

	return (
		<GenericLayout>
			<PageMeta title="Ylide Social Hub – Explore Web3 Communities" />

			<RegularPageContent>
				<div className={css.root}>
					<div className={css.banner} onClick={() => openCreateCommunityForm('explore_banner')}>
						<img src={bannerSrc} alt="Banner" />
					</div>

					<h1 className={css.heading}>
						Discover Web3 <span>Communities</span>
					</h1>

					<div className={css.bigGrid}>
						<RichProjectCard project={getBlockchainProjectById(BlockchainProjectId.GENERAL)} />
						<RichProjectCard project={getBlockchainProjectById(BlockchainProjectId.YLIDE)} />
						<RichProjectCard project={getBlockchainProjectById(BlockchainProjectId.VENOM_BLOCKCHAIN)} />
						<RichProjectCard project={getBlockchainProjectById(BlockchainProjectId.ETH_WHALES)} />
					</div>

					{renderTagBlock(BlockchainProjectTag.DEFI)}
					{renderTagBlock(BlockchainProjectTag.NFT)}
					{renderTagBlock(BlockchainProjectTag.VENOM)}
					{renderTagBlock(BlockchainProjectTag.TVM)}
					{renderTagBlock(BlockchainProjectTag.SOCIAL)}
					{renderTagBlock(BlockchainProjectTag.ECOSYSTEM)}
					{renderTagBlock(BlockchainProjectTag.GAMING)}
					{renderTagBlock(BlockchainProjectTag.DEVELOPER_TOOLS)}

					<div className={css.footer}>
						<ActionButton
							size={ActionButtonSize.LARGE}
							look={ActionButtonLook.HEAVY}
							onClick={() => openCreateCommunityForm('explore_bottom')}
						>
							Create your own community
						</ActionButton>
					</div>
				</div>
			</RegularPageContent>
		</GenericLayout>
	);
}

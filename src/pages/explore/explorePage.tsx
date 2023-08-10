import { MiniProjectCard } from '../../components/blockchainProjectCards/miniProjectCard/miniProjectCard';
import { RegularProjectCard } from '../../components/blockchainProjectCards/regularProjectCard/regularProjectCard';
import { RichProjectCard } from '../../components/blockchainProjectCards/richProjectCard/richProjectCard';
import { RegularPageContent } from '../../components/genericLayout/content/regularPageContent/regularPageContent';
import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { ReactComponent as TagSvg } from '../../icons/ic28/tag.svg';
import {
	BlockchainProjectId,
	blockchainProjects,
	getBlockchainProjectById,
} from '../../stores/blockchainProjects/blockchainProjects';
import bannerSrc from './banner.png';
import css from './explorePage.module.scss';

export function ExplorePage() {
	return (
		<GenericLayout>
			<RegularPageContent>
				<div className={css.root}>
					<div className={css.banner}>
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

					<div>
						<div className={css.tagTitle}>
							<TagSvg />

							<div>
								Ecosystem <span>communities</span>
							</div>
						</div>

						<div className={css.smallGrid}>
							{blockchainProjects
								.filter(p => p.tags.includes('Ecosystem'))
								.map(project => (
									<RegularProjectCard project={project} />
								))}
						</div>
					</div>

					<div className={css.bigGrid}>
						<RichProjectCard project={getBlockchainProjectById(BlockchainProjectId.TVM)} />
						<RichProjectCard project={getBlockchainProjectById(BlockchainProjectId.GRAVIX)} />
					</div>

					<div>
						<div className={css.tagTitle}>
							<TagSvg />

							<div>
								Venom <span>communities</span>
							</div>
						</div>

						<div className={css.smallGrid}>
							{blockchainProjects
								.filter(p => p.tags.includes('Venom'))
								.map(project => (
									<RegularProjectCard project={project} />
								))}
						</div>
					</div>

					<div className={css.bigGrid}>
						<RichProjectCard project={getBlockchainProjectById(BlockchainProjectId.SNIPA)} />
						<RichProjectCard project={getBlockchainProjectById(BlockchainProjectId.OASIS_GALLERY)} />
					</div>

					<div>
						<div className={css.tagTitle}>
							<TagSvg />

							<div>
								<span>All communities</span>
							</div>
						</div>

						<div className={css.miniGrid}>
							{blockchainProjects.map(project => (
								<MiniProjectCard project={project} />
							))}
						</div>
					</div>

					<div className={css.footer}>The End</div>
				</div>
			</RegularPageContent>
		</GenericLayout>
	);
}

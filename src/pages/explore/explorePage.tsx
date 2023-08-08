import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { ReactComponent as TagSvg } from '../../icons/ic28/tag.svg';
import { BlockchainProjectId, blockchainProjects } from '../../stores/blockchainProjects/blockchainProjects';
import bannerSrc from './banner.png';
import css from './explorePage.module.scss';
import { RegularProjectCard } from './regularProjectCard/regularProjectCard';
import { RichProjectCard } from './richProjectCard/richProjectCard';

export interface ExplorePageProps {}

export function ExplorePage({}: ExplorePageProps) {
	return (
		<GenericLayout>
			<div className={css.root}>
				<img className={css.banner} src={bannerSrc} alt="Banner" />

				<h1 className={css.heading}>
					Discover Hundreds of <span>Communities</span>
				</h1>

				<div className={css.bigGrid}>
					<RichProjectCard project={blockchainProjects[BlockchainProjectId.VENOM_BLOCKCHAIN]} />
					<RichProjectCard project={blockchainProjects[BlockchainProjectId.ETH_WHALES]} />
				</div>

				<div>
					<div className={css.tagTitle}>
						<TagSvg />

						<div>
							Blockchain <span>communities</span>
						</div>
					</div>

					<div className={css.smallGrid}>
						{Object.values(blockchainProjects)
							.filter(p => p.tags.includes('Blockchain'))
							.map(project => (
								<RegularProjectCard project={project} />
							))}
					</div>
				</div>

				<div className={css.bigGrid}>
					<RichProjectCard project={blockchainProjects[BlockchainProjectId.TVM]} />
					<RichProjectCard project={blockchainProjects[BlockchainProjectId.GRAVIX]} />
				</div>

				<div>
					<div className={css.tagTitle}>
						<TagSvg />

						<div>
							Venom <span>communities</span>
						</div>
					</div>

					<div className={css.smallGrid}>
						{Object.values(blockchainProjects)
							.filter(p => p.tags.includes('Venom'))
							.map(project => (
								<RegularProjectCard project={project} />
							))}
					</div>
				</div>

				<div className={css.footer}>The End</div>
			</div>
		</GenericLayout>
	);
}

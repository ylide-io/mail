import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../components/ActionButton/ActionButton';
import { RegularCommunityCard } from '../../components/communityCards/regularCommunityCard/regularCommunityCard';
import { RichCommunityCard } from '../../components/communityCards/richCommunityCard/richCommunityCard';
import { RegularPageContent } from '../../components/genericLayout/content/regularPageContent/regularPageContent';
import { GenericLayout } from '../../components/genericLayout/genericLayout';
import { PageMeta } from '../../components/pageMeta/pageMeta';
import { ReactComponent as TagSvg } from '../../icons/ic28/tag.svg';
import { communities, CommunityId, CommunityTag, getCommunityById } from '../../stores/communities/communities';
import { openCreateCommunityForm } from '../../utils/misc';
import bannerSrc from './banner.png';
import css from './explorePage.module.scss';

export function ExplorePage() {
	function renderTagBlock(tag: CommunityTag) {
		return (
			<div>
				<div className={css.tagTitle}>
					<TagSvg />

					<div>
						{tag} <span>communities</span>
					</div>
				</div>

				<div className={css.smallGrid}>
					{communities
						.filter(c => c.tags?.includes(tag) && !c.hidden)
						.map(community => (
							<RegularCommunityCard community={community} />
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
						<RichCommunityCard community={getCommunityById(CommunityId.GENERAL)} />
						<RichCommunityCard community={getCommunityById(CommunityId.YLIDE)} />
						<RichCommunityCard community={getCommunityById(CommunityId.VENOM_BLOCKCHAIN)} />
						<RichCommunityCard community={getCommunityById(CommunityId.ETH_WHALES)} />
					</div>

					{renderTagBlock(CommunityTag.DEFI)}
					{renderTagBlock(CommunityTag.NFT)}
					{renderTagBlock(CommunityTag.ZETACHAIN_ECOSYSTEM)}
					{renderTagBlock(CommunityTag.VENOM)}
					{renderTagBlock(CommunityTag.TVM)}
					{renderTagBlock(CommunityTag.SOCIAL)}
					{renderTagBlock(CommunityTag.ECOSYSTEM)}
					{renderTagBlock(CommunityTag.GAMING)}
					{renderTagBlock(CommunityTag.TRADING)}

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

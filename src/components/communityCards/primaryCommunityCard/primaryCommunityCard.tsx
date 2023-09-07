import { observer } from 'mobx-react';
import { useRef, useState } from 'react';

import { ReactComponent as ClipboardSvg } from '../../../icons/ic20/clipboard.svg';
import { ReactComponent as ContactSvg } from '../../../icons/ic20/contact.svg';
import { ReactComponent as LinkSvg } from '../../../icons/ic20/link.svg';
import { ReactComponent as MailSvg } from '../../../icons/ic20/mail.svg';
import { ReactComponent as TagSvg } from '../../../icons/ic20/tag.svg';
import { Community } from '../../../stores/communities/communities';
import { OutgoingMailData } from '../../../stores/outgoingMailData';
import { HorizontalAlignment } from '../../../utils/alignment';
import { copyToClipboard } from '../../../utils/clipboard';
import { useOpenMailCompose } from '../../../utils/mail';
import { beautifyUrl } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
import { AdaptiveAddress } from '../../adaptiveAddress/adaptiveAddress';
import { CommunityAvatar } from '../../avatar/avatar';
import { CommunityBanner } from '../../communityBanner/communityBanner';
import { AnchoredPopup } from '../../popup/anchoredPopup/anchoredPopup';
import { Recipients } from '../../recipientInput/recipientInput';
import css from './primaryCommunityCard.module.scss';

export interface PrimaryCommunityCardProps {
	community: Community;
}

export const PrimaryCommunityCard = observer(({ community }: PrimaryCommunityCardProps) => {
	const adminButtonRef = useRef(null);
	const admins = ['dskfjgserut99ugf9s0h7g09dfsh9fsd8h998gsd09f8g', 'gjsdfjg'];
	const [adminPopupOpen, setAdminPopupOpen] = useState(false);

	const openMailCompose = useOpenMailCompose();

	return (
		<div className={css.root}>
			<CommunityBanner className={css.banner} community={community} />

			<div className={css.body}>
				<CommunityAvatar community={community} />

				<div>
					<h1 className={css.name}>{community.name}</h1>

					{!!community.description && <div className={css.description}>{community.description}</div>}

					<div className={css.meta}>
						{(!!community.tags?.length || !!community.website) && (
							<div className={css.metaLeft}>
								{!!community.tags?.length && (
									<div className={css.tags}>
										{community.tags.map(tag => (
											<div key={tag} className={css.tag}>
												<TagSvg />
												{tag}
											</div>
										))}
									</div>
								)}

								{!!community.website && (
									<a className={css.website} href={community.website}>
										<LinkSvg />

										{beautifyUrl(community.website)}
									</a>
								)}
							</div>
						)}

						{!!admins.length && (
							<ActionButton
								ref={adminButtonRef}
								size={ActionButtonSize.XSMALL}
								look={ActionButtonLook.HEAVY}
								icon={<ContactSvg />}
								onClick={() => setAdminPopupOpen(!adminPopupOpen)}
							>
								Contact Admin
							</ActionButton>
						)}

						{adminPopupOpen && (
							<AnchoredPopup
								className={css.adminPopup}
								anchorRef={adminButtonRef}
								horizontalAlign={HorizontalAlignment.END}
								alignerOptions={{
									fitLeftToViewport: true,
								}}
								onCloseRequest={() => setAdminPopupOpen(false)}
							>
								<div className={css.adminInner}>
									<b>Administrators of this community</b>

									<div className={css.adminItems}>
										{admins.map(address => (
											<div className={css.adminItem}>
												<AdaptiveAddress className={css.adminAddress} address={address} />

												<ActionButton
													icon={<ClipboardSvg />}
													title="Copy to clipboard"
													onClick={() => copyToClipboard(address, { toast: true })}
												/>

												<ActionButton
													look={ActionButtonLook.PRIMARY}
													icon={<MailSvg />}
													title="Send message"
													onClick={() => {
														setAdminPopupOpen(false);

														const mailData = new OutgoingMailData();
														mailData.to = new Recipients([address]);
														openMailCompose({ mailData });
													}}
												/>
											</div>
										))}
									</div>
								</div>
							</AnchoredPopup>
						)}
					</div>
				</div>
			</div>
		</div>
	);
});

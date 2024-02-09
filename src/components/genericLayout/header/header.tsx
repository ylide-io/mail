import { observer } from 'mobx-react';
import { useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { ReactComponent as ArrowDownSvg } from '../../../icons/ic20/arrowDown.svg';
import { ReactComponent as PlusSvg } from '../../../icons/ic20/plus.svg';
import { ReactComponent as LogoutSvg } from '../../../icons/ic28/logout.svg';
import domain from '../../../stores/Domain';
import { RoutePath } from '../../../stores/routePath';
import { connectWalletAccount } from '../../../utils/account';
import { HorizontalAlignment } from '../../../utils/alignment';
import { truncateAddress } from '../../../utils/string';
import { useNav } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
import { AppLogo } from '../../appLogo/appLogo';
import { Avatar } from '../../avatar/avatar';
import { GridRowBox, TruncateTextBox } from '../../boxes/boxes';
import { DropDown, DropDownItem } from '../../dropDown/dropDown';
import { SidebarBurger } from '../sidebar/sidebarMenu';
import css from './header.module.scss';

const Header = observer(() => {
	const [isOpen, setOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const navigate = useNav();

	return (
		<div className={css.root}>
			<SidebarBurger className={css.burger} />

			<a
				className={css.logo}
				href={generatePath(RoutePath.ROOT)}
				onClick={e => {
					e.preventDefault();
					navigate(generatePath(RoutePath.ROOT));
				}}
			>
				<AppLogo />
			</a>

			<div className={css.right}>
				{domain.account ? (
					<>
						<button
							ref={buttonRef}
							className={css.users}
							onClick={() => {
								setOpen(true);
							}}
						>
							<div>
								<Avatar
									key={domain.account.address}
									className={css.usersAvatar}
									blockie={domain.account.address}
								/>
							</div>

							<div className={css.usersText}>
								{domain.account.address
									? truncateAddress(domain.account.address, 24)
									: domain.account.email}
							</div>

							<ArrowDownSvg className={css.usersIcon} />
						</button>
						{isOpen && (
							<DropDown
								anchorRef={buttonRef}
								horizontalAlign={HorizontalAlignment.END}
								onCloseRequest={() => setOpen(false)}
							>
								<DropDownItem
									onSelect={() => {
										domain.logout();
										setOpen(false);
									}}
								>
									<GridRowBox>
										<LogoutSvg />
										<TruncateTextBox>Logout</TruncateTextBox>
									</GridRowBox>
								</DropDownItem>
							</DropDown>
						)}
					</>
				) : (
					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						icon={<PlusSvg />}
						onClick={() => connectWalletAccount({ place: 'header' })}
					>
						Connect wallet
					</ActionButton>
				)}
			</div>
		</div>
	);
});

export default Header;

import { observer } from 'mobx-react';
import { useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { ReactComponent as ArrowDownSvg } from '../../../icons/ic20/arrowDown.svg';
import { ReactComponent as PlusSvg } from '../../../icons/ic20/plus.svg';
import domain from '../../../stores/Domain';
import { RoutePath } from '../../../stores/routePath';
import { useNav } from '../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../ActionButton/ActionButton';
import { AppLogo } from '../../appLogo/appLogo';
import { Avatar } from '../../avatar/avatar';
import { SidebarBurger } from '../sidebar/sidebarMenu';
import css from './header.module.scss';
import { connectAccount } from '../../../utils/account';

const Header = observer(() => {
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
						<button className={css.users} onClick={() => domain.showAccountModal()}>
							<div>
								<Avatar
									key={domain.account.address}
									className={css.usersAvatar}
									blockie={domain.account.address}
								/>
							</div>

							<div className={css.usersText}>
								1 account
								<span>&nbsp;connected</span>
							</div>

							<ArrowDownSvg className={css.usersIcon} />
						</button>
					</>
				) : (
					<ActionButton
						size={ActionButtonSize.MEDIUM}
						look={ActionButtonLook.PRIMARY}
						icon={<PlusSvg />}
						onClick={() => connectAccount({ place: 'header' })}
					>
						Connect wallet
					</ActionButton>
				)}
			</div>
		</div>
	);
});

export default Header;

import clsx from 'clsx';
import { observer } from 'mobx-react';
import { ReactNode } from 'react';

import { PropsWithClassName } from '../../props';
import css from './walletIcon.module.scss';

export interface WalletIconProps extends PropsWithClassName {
	icon: ReactNode;
	name: ReactNode;
	onClick: () => void;
}

export const WalletIcon = observer(({ className, icon, name, onClick }: WalletIconProps) => {
	return (
		<div className={clsx(css.root, className)} onClick={() => onClick()}>
			<div className={css.block}>
				<div className={css.image}>{icon}</div>
			</div>
			<div className={css.title}>{name}</div>
		</div>
	);
});

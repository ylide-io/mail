import clsx from 'clsx';

import { ReactComponent as MainViewLogoSvg } from '../../assets/mainViewLogo.svg';
import { ReactComponent as YlideLogoSvg } from '../../assets/ylideLogo.svg';
import { AppMode, REACT_APP__APP_MODE } from '../../env';
import { PropsWithClassName } from '../props';
import css from './appLogo.module.scss';

interface AppLogoProps extends PropsWithClassName {}

export function AppLogo({ className }: AppLogoProps) {
	const Component = REACT_APP__APP_MODE === AppMode.MAIN_VIEW ? MainViewLogoSvg : YlideLogoSvg;

	return <Component className={clsx(css.root, className)} />;
}

import clsx from 'clsx';

import { ReactComponent as MainViewLogoSvg } from '../../assets/mainViewLogo.svg';
import { PropsWithClassName } from '../props';
import css from './appLogo.module.scss';

interface AppLogoProps extends PropsWithClassName {}

export function AppLogo({ className }: AppLogoProps) {
	const Component = MainViewLogoSvg;

	return <Component className={clsx(css.root, className)} />;
}

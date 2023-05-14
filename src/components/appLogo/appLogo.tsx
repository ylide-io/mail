import clsx from 'clsx';

import { ReactComponent as MainViewLogoSvg } from '../../assets/mainViewLogo.svg';
import { ReactComponent as YlideLogoSvg } from '../../assets/ylideLogo.svg';
import { REACT_APP__SMART_FEED_MODE } from '../../env';
import { PropsWithClassName } from '../props';
import css from './appLogo.module.scss';

interface AppLogoProps extends PropsWithClassName {}

export function AppLogo({ className }: AppLogoProps) {
	const Component = REACT_APP__SMART_FEED_MODE ? MainViewLogoSvg : YlideLogoSvg;

	return <Component className={clsx(css.root, className)} />;
}

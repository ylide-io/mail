import { ReactComponent as MainViewLogoSvg } from '../../assets/mainViewLogo.svg';
import css from './mainviewLoader.module.scss';

export const MainviewLoader = () => {
	return (
		<div className={css.root}>
			<MainViewLogoSvg />
		</div>
	);
};

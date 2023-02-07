import { YlideLoader } from '../ylideLoader/ylideLoader';
import css from './overlappingLoader.module.scss';

interface OverlappingLoaderProps {
	text: string;
}

export function OverlappingLoader({ text }: OverlappingLoaderProps) {
	return (
		<div className={css.root}>
			<YlideLoader reason={text} />
		</div>
	);
}

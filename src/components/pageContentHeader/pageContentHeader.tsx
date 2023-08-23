import { observer } from 'mobx-react';
import { ReactNode } from 'react';

import { ReactComponent as ArrowLeftSvg } from '../../icons/ic20/arrowLeft.svg';
import { useNav } from '../../utils/url';
import { ActionButton } from '../ActionButton/ActionButton';
import css from './pageContentHeader.module.scss';

export interface PageContentHeaderProps {
	title?: ReactNode;
	backButton?: {
		href: string;
		goBackIfPossible?: boolean;
	};
	right?: ReactNode;
}

export const PageContentHeader = observer(({ title, backButton, right }: PageContentHeaderProps) => {
	const navigate = useNav();

	return (
		<div className={css.root}>
			<div className={css.left}>
				{backButton && (
					<ActionButton
						className={css.backButton}
						onClick={() => navigate(backButton.href, { goBackIfPossible: backButton?.goBackIfPossible })}
						icon={<ArrowLeftSvg />}
					/>
				)}

				{title != null && <h1 className={css.title}>{title}</h1>}
			</div>

			<div className={css.right}>{right}</div>
		</div>
	);
});

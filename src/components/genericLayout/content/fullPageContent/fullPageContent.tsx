import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { useNav } from '../../../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../ActionButton/ActionButton';
import { PropsWithClassName } from '../../../props';
import css from './fullPageContent.module.scss';

export interface FullPageContentProps extends PropsWithChildren<{}>, PropsWithClassName {
	mobileTopButtonProps?: {
		text: string;
		link: string;
	};
}

export function FullPageContent({ children, className, mobileTopButtonProps }: FullPageContentProps) {
	const navigate = useNav();

	return (
		<div className={clsx(css.root, className)}>
			{!!mobileTopButtonProps && (
				<ActionButton
					className={css.linkButton}
					size={ActionButtonSize.XLARGE}
					look={ActionButtonLook.PRIMARY}
					onClick={() => navigate(mobileTopButtonProps.link)}
				>
					{mobileTopButtonProps.text}
				</ActionButton>
			)}

			{children}
		</div>
	);
}

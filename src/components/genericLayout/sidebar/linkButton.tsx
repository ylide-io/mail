import clsx from 'clsx';
import React from 'react';

import { useNav } from '../../../utils/navigate';
import { PropsWithClassName } from '../../propsWithClassName';
import css from './linkButton.module.scss';

export enum LinkButtonType {
	DEFAULT,
	PRIMARY,
}

interface LinkButtonProps extends PropsWithClassName {
	type?: LinkButtonType;
	text: string;
	link: string;
}

export const LinkButton = ({ className, type, text, link }: LinkButtonProps) => {
	const navigate = useNav();

	const typeClass = {
		[LinkButtonType.DEFAULT]: css.root_default,
		[LinkButtonType.PRIMARY]: css.root_primary,
	}[type || LinkButtonType.DEFAULT];

	return (
		<div className={className}>
			<button className={clsx(css.root, typeClass)} onClick={() => navigate(link)}>
				{text}
			</button>
		</div>
	);
};

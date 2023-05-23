import clsx from 'clsx';
import React from 'react';

import { useOnMountAnimation } from '../../utils/useOnMountAnimation';
import { Popup } from '../popup/popup';
import css from './overlay.module.scss';

export interface OverlayProps {
	isHidden?: boolean;
	isBlur?: boolean;
	onClick?: () => void;
}

export function Overlay({ isHidden, isBlur, onClick }: OverlayProps) {
	const isVisible = useOnMountAnimation();

	return (
		<Popup
			className={clsx(css.root, !isHidden && isVisible && css.root_visible, isBlur && css.root_blur)}
			onClick={() => onClick?.()}
		/>
	);
}

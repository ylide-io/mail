import clsx from 'clsx';
import React from 'react';

import { useOnMountAnimation } from '../../utils/useOnMountAnimation';
import { Popup } from '../popup/popup';
import css from './overlay.module.scss';

export interface OverlayProps {
	isHidden?: boolean;
	onClick?: () => void;
}

export function Overlay({ isHidden, onClick }: OverlayProps) {
	const isVisible = useOnMountAnimation();

	return <Popup className={clsx(css.root, !isHidden && isVisible && css.root_visible)} onClick={() => onClick?.()} />;
}

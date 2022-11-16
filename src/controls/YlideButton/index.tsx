import React, { ButtonHTMLAttributes, CSSProperties, FC, PropsWithChildren } from 'react';
import cn from 'classnames';

export const YlideButton: FC<
	PropsWithChildren<{
		className?: string;
		onClick?: React.MouseEventHandler<HTMLButtonElement>;
		ghost?: boolean;
		size?: 'tiny' | 'small' | 'default';
		centered?: boolean;
		style?: CSSProperties;
		type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
	}>
> = ({ children, className, onClick, size = 'default', centered, ghost, style, type }) => {
	return (
		<button
			type={type}
			className={cn('ylide-button', className, { centered, ghost }, `size-${size}`)}
			style={style}
			onClick={onClick}
		>
			{children}
		</button>
	);
};

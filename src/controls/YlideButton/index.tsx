import React, { ButtonHTMLAttributes, CSSProperties, FC, PropsWithChildren } from 'react';
import cn from 'classnames';

export const YlideButton: FC<
	PropsWithChildren<{
		className?: string;
		onClick?: React.MouseEventHandler<HTMLButtonElement>;
		ghost?: boolean;
		nice?: boolean;
		size?: 'tiny' | 'small' | 'default';
		primary?: boolean;
		centered?: boolean;
		style?: CSSProperties;
		type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
	}>
> = ({ children, className, onClick, size = 'default', nice, centered, ghost, style, type, primary }) => {
	return (
		<button
			type={type}
			className={cn('ylide-button', className, { centered, ghost, nice, primary }, `size-${size}`)}
			style={style}
			onClick={onClick}
		>
			{children}
		</button>
	);
};

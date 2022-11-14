import React, { ButtonHTMLAttributes, CSSProperties, FC, PropsWithChildren } from 'react';
import cn from 'classnames';

export const YlideButton: FC<
	PropsWithChildren<{
		small?: boolean;
		className?: string;
		onClick?: React.MouseEventHandler<HTMLButtonElement>;
		ghost?: boolean;
		centered?: boolean;
		style?: CSSProperties;
		type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
	}>
> = ({ children, className, onClick, small, centered, ghost, style, type }) => {
	return (
		<button
			type={type}
			className={cn('ylide-button', className, { small, centered, ghost })}
			style={style}
			onClick={onClick}
		>
			{children}
		</button>
	);
};

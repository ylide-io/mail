import React from 'react';
import classNames from 'classnames';

export enum smallButtonColors {
	red = 'btn-danger',
	green = 'btn-primary',
	white = 'btn-white',
}

export enum smallButtonIcons {
	reply = 'fa-reply',
	cross = 'fa-times',
	pencil = 'fa-pencil',
	refresh = 'fa-refresh',
	eye = 'fa-eye',
	exclamation = 'fa-exclamation',
	print = 'fa-print',
	trash = 'fa-trash-o',
	restore = 'fa-rotate-left',
	forward = 'fa-arrow-right',
	arrowLeft = 'fa-arrow-left',
	calendar = 'fa-calendar',
}

interface SmallButtonProps {
	text?: React.ReactNode;
	color: smallButtonColors;
	title?: string;
	icon?: smallButtonIcons;
	onClick?: (arg1: any) => void;
	additionalClass?: classNames.Argument;
	disabled?: boolean;
}

const SmallButton: React.FC<SmallButtonProps> = ({ text, color, title, icon, onClick, additionalClass, disabled }) => {
	return (
		<button
			disabled={disabled}
			className={classNames('btn btn-sm', color, additionalClass)}
			title={title}
			onClick={onClick}
		>
			<i className={classNames('fa', icon)}></i>
			{text && <span>{text}</span>}
		</button>
	);
};

export default SmallButton;

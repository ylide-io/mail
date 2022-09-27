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
	forward = 'fa-arrow-right',
	arrowLeft = 'fa-arrow-left',
}

interface SmallButtonProps {
	text?: string;
	color: smallButtonColors;
	title?: string;
	icon?: smallButtonIcons;
	onClick?: (arg1: any) => void;
	additionalClass?: any;
	disabled?: boolean;
}

const SmallButton: React.FC<SmallButtonProps> = ({ text, color, title, icon, onClick, additionalClass, disabled }) => {
	return (
		<button
			disabled={disabled}
			className={classNames('btn btn-sm', color, additionalClass)}
			data-toggle="tooltip"
			data-placement="top"
			title={title}
			onClick={onClick}
		>
			<i className={classNames('fa', icon)}></i>
			{text && <span>{text}</span>}
		</button>
	);
};

export default SmallButton;

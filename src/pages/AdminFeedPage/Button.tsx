type Props = {
	disabled: boolean;
	onClick: () => void;
	text: string;
};

export const Button = ({ onClick, disabled, text }: Props) => {
	return (
		<button
			style={{
				border: '1px solid black',
				padding: '5px 10px',
				margin: 5,
				borderRadius: 20,
				backgroundColor: disabled ? 'gray' : 'transparent',
				cursor: disabled ? 'default' : 'pointer',
			}}
			onClick={onClick}
			disabled={disabled}
		>
			{text}
		</button>
	);
};

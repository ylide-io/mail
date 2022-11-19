import React from 'react';

interface ColorPickerProps {
	color: string;
	active?: boolean;
	onClick: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, active, onClick }) => {
	const styles = () => {
		let styles: React.CSSProperties = {
			width: 22,
			height: 22,
			borderRadius: 25,
			margin: '0 4px',
		};

		if (!active) {
			styles = {
				...styles,
				opacity: 0.8,
				cursor: 'pointer',
			};
		}

		return styles;
	};

	return (
		<div onClick={() => onClick(color)} style={!active ? { opacity: 0.8 } : {}}>
			<div style={Object.assign({ backgroundColor: color }, styles())} />
		</div>
	);
};

export default ColorPicker;

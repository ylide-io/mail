import { CSSProperties } from 'react';

export function ArrowRight({ size = 16, style }: { size?: number; style?: CSSProperties }) {
	return (
		<svg
			width={size}
			height={size}
			style={style}
			fill="none"
			className="y-icon"
			viewBox="0 0 20 20"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M1 10L19 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M10 1L19 10L10 19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

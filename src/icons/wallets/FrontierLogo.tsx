import { CSSProperties } from 'react';

export function FrontierLogo({ size = 16, style }: { size?: number; style?: CSSProperties }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			version="1.1"
			width={size}
			height={size}
			x="0px"
			y="0px"
			viewBox="0 0 2500 2500"
			enableBackground="new 0 0 2500 2500"
		>
			<g>
				<g>
					<radialGradient
						id="SVGID_1_"
						cx="892.72"
						cy="1499.8098"
						r="800"
						gradientTransform="matrix(1.5625 0 0 -1.5625 -844.5 3043.2029)"
						gradientUnits="userSpaceOnUse"
					>
						<stop offset="0" stopColor="#EF7937"></stop>
						<stop offset="0.502" stopColor="#EA7839"></stop>
						<stop offset="0.7843" stopColor="#DF773D"></stop>
						<stop offset="1" stopColor="#D57641"></stop>
					</radialGradient>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						fill="url(#SVGID_1_)"
						d="M509.1,0h1481.9c280,0,509.1,229.1,509.1,509.1v1481.9c0,280-229.1,509.1-509.1,509.1H509.1    C229.1,2500,0,2270.9,0,1990.9V509.1C0,229.1,229.1,0,509.1,0L509.1,0z"
					></path>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						fill="#FFFFFF"
						d="M1960.3,430.2l-38.4,103.4l-19.6,50.8c-148.7,380.7-264.3,561.4-387.2,561.4c-70.8,0-112.8-21.2-167-70.8    l-15.7-14.7c-39.1-37.3-55.5-46.5-93.1-46.5c-19.6,0-54.6,26-98.9,86.5c-46,62.8-96.4,155.6-150.6,277.8l-5,11.4l527.4,0    l-65.7,140.9H953.9v578.6H809.2v-1679L1960.3,430.2L1960.3,430.2z M1755.1,571.2l-801.2-0.1v559.6    c96-172.2,187.2-258.7,285.3-258.7c76.3,0,121.2,22.2,178,73.9l16.2,15.2c36.5,34.8,50.5,42.8,81.6,42.8    C1549.4,1003.9,1640.6,854.3,1755.1,571.2z"
					></path>
				</g>
			</g>
		</svg>
	);
}

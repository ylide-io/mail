import { CSSProperties } from 'react';

export function AstarLogo({ size = 16, style }: { size?: number; style?: CSSProperties }) {
	return (
		<img style={style} alt="astar logo" width={size} height={size} src={require('../assets/img/astar-logo.png')} />
	);
}

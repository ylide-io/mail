import { Loader } from './Loader';

export function OverlappingLoader({ text }: { text: string }) {
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				zIndex: 200,
				backdropFilter: 'blur(10px)',
			}}
		>
			<Loader />
			<br />
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					paddingTop: 200,
					position: 'absolute',
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
					zIndex: 201,
					color: 'black',
					fontSize: 20,
					fontWeight: 'bold',
				}}
			>
				{text}
			</div>
		</div>
	);
}

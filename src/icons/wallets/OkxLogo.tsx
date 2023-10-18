import { CSSProperties } from 'react';

export const OkxLogo = ({ size = 16, style }: { size?: number; style?: CSSProperties }) => {
	return (
		<svg
			width={size}
			height={size}
			style={style}
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
		>
			<rect width="48" height="48" fill="url(#pattern0)" />
			<defs>
				<pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
					<use xlinkHref="#image0_101_2" transform="scale(0.0208333)" />
				</pattern>
				<image
					id="image0_101_2"
					width="48"
					height="48"
					xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACcUlEQVRoge2ZvY7aQBDHx5atNVoju6JxQyRwAwgXLigsszzBKU+QvAk8SvIEiZ8AX0eH09KEFFDQnBGcMLbRpgpKwoeXk4/16fyTphvPzn+93tF4BDgDIURP0/RTmqbWbrezoijSKaX1c76vhSzLc0ppWK1W5wih73EcP04mk3nmg67rDhuNxpOmaRQACmEYY2qaJnVdd3gxcUJI3bbtKcaYe8KXTFEUatv2tNfrnZ4G27anCCHuSbKK+Cd513WHbyH5P4Yxpo7jjAAABEJIfblc/pzNZidvpcg0m83QMIwP4uFwIIvFgnc+N7NarfQkST6LcRw/PD8/887nZtbrNaRp2hW32+1d7/c8iaLIkgBAZ3G2LAt0/bqr7/tMC+cVa7/f62CaZuZXTwihLFiWdddYpmlSkWnLGMna1deIlasAHpQCeFMK4M37EBCGYW4L5hkLAEBicQqCAAaDwVWfMAyh3+/DcHi5aQIA8DyPKVYQBCypAVMlZrXxeJxZYcfjcW7r5V6JeVAK4E0pgDelAN4wFTIAtjbQ87zMOJ7n5dqeli3l35Qt5QsoBfCmFMCb9yGg0C2lKIpzALj6h5q1pWRpA/OMJcvyHLrd7hQKMDZ6ibVaramIEPqRKbWgqKr6S5RlOdA0jXcuN4MxBoTQN1GW5S+1Wi3fL+sOGIYBcRw/AgCA4zijIg+4/zdFUY5j1iNvddB9rAOqqn7sdDoBQuj8OysAGGNot9uBqqqX72HHcUamadIiHSlN02ij0Xg6OTYAIJwTQQipHw4HEsfxw2azqQuCoCdJctdxrCAIc0VRwkqlEkiSFEiS9NX3/ZPL5jdzIS3Sk/pMJgAAAABJRU5ErkJggg=="
				/>
			</defs>
		</svg>
	);
};

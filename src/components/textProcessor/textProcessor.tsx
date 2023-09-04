import { ReactNode, useMemo } from 'react';

import { transformMatches } from '../../utils/string';

interface TextProcessorProps {
	text: string;
	nlToBr?: boolean;
	linksToAnchors?: boolean;
}

export function TextProcessor({ text, nlToBr, linksToAnchors }: TextProcessorProps) {
	const pieces = useMemo(() => {
		let pieces: ReactNode[] = [text];

		if (nlToBr) {
			pieces = text.split('\n').reduce<ReactNode[]>((res, curr, i) => {
				if (res.length) {
					res.push(<br key={`nlToBr ${i}`} />);
				}

				res.push(curr);

				return res;
			}, []);
		}

		if (linksToAnchors) {
			pieces = pieces.reduce<ReactNode[]>((res, curr, i) => {
				if (typeof curr === 'string') {
					res.push(
						// https://regexr.com/7jk80
						...transformMatches(curr, /((?<=^|\s)(https?:\/\/)\S{3,1024})(?=$|\s)/gi, (item, j) => (
							<a key={`linksToAnchors ${i} ${j}`} href={item} target="_blank" rel="noreferrer">
								{item}
							</a>
						)),
					);
				} else {
					res.push(curr);
				}

				return res;
			}, []);
		}

		return pieces;
	}, [linksToAnchors, nlToBr, text]);

	return <>{pieces}</>;
}

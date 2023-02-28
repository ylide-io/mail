import React, { ReactNode } from 'react';

interface NlToBrProps {
	text: string;
}

export function NlToBr({ text }: NlToBrProps) {
	return (
		<>
			{text.split('\n').reduce((prev, curr, i) => {
				if (prev.length) {
					prev.push(<br key={i} />);
				}

				prev.push(curr);

				return prev;
			}, [] as ReactNode[])}
		</>
	);
}

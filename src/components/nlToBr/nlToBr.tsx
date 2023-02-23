import React, { ReactNode } from 'react';

interface NlToBrProps {
	children: string;
}

export function NlToBr({ children }: NlToBrProps) {
	return (
		<>
			{children.split('\n').reduce((prev, curr, i) => {
				if (prev.length) {
					prev.push(<br key={i} />);
				}

				prev.push(curr);

				return prev;
			}, [] as ReactNode[])}
		</>
	);
}

import React, { createContext, PropsWithChildren, ReactNode, ReactPortal, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';

interface PopupManagerApi {
	createPortal: (content: ReactNode) => ReactPortal | null;
}

export const PopupManagerContext = createContext<PopupManagerApi | undefined>(undefined);

export function PopupManager({ children }: PropsWithChildren<{}>) {
	const mainRef = useRef<HTMLDivElement>(null);

	const api = useMemo<PopupManagerApi>(
		() => ({
			createPortal: (content: ReactNode) => {
				return mainRef.current && ReactDOM.createPortal(content, mainRef.current);
			},
		}),
		[mainRef],
	);

	return (
		<PopupManagerContext.Provider value={api}>
			{children}

			<div ref={mainRef} style={{ position: 'relative', zIndex: 1 }} />
		</PopupManagerContext.Provider>
	);
}

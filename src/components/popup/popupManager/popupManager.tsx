import { createContext, createRef, PropsWithChildren, ReactNode, ReactPortal, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface PopupManagerApi {
	createPortal: (content: ReactNode) => ReactPortal | null;
}

export const PopupManagerContext = createContext<PopupManagerApi | undefined>(undefined);

export function PopupManager({ children }: PropsWithChildren) {
	const mainRef = createRef<HTMLDivElement>();

	const api = useMemo<PopupManagerApi>(
		() => ({
			createPortal: (content: ReactNode) => {
				return mainRef.current && createPortal(content, mainRef.current);
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

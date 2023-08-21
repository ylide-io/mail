import { createContext, PropsWithChildren, ReactNode, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';

interface PopupManagerApi {
	renderPopup: (content: ReactNode, level?: PopupManagerPortalLevel) => ReactNode;
}

export const PopupManagerContext = createContext<PopupManagerApi | undefined>(undefined);

export enum PopupManagerPortalLevel {
	NO_PORTAL = 'NO_PORTAL',
	REGULAR = 'REGULAR',
	UPPER = 'UPPER',
}

export function PopupManager({ children }: PropsWithChildren<{}>) {
	const regularContainerRef = useRef<HTMLDivElement>(null);
	const upperContainerRef = useRef<HTMLDivElement>(null);

	const api = useMemo<PopupManagerApi>(
		() => ({
			renderPopup: (content: ReactNode, level = PopupManagerPortalLevel.REGULAR) => {
				if (level === PopupManagerPortalLevel.NO_PORTAL) {
					return content;
				}

				const containerRef = {
					[PopupManagerPortalLevel.REGULAR]: regularContainerRef,
					[PopupManagerPortalLevel.UPPER]: upperContainerRef,
				}[level];

				return containerRef.current && ReactDOM.createPortal(content, containerRef.current);
			},
		}),
		[],
	);

	return (
		<PopupManagerContext.Provider value={api}>
			{children}

			<div ref={regularContainerRef} style={{ position: 'relative', zIndex: 1 }} />
			<div ref={upperContainerRef} style={{ position: 'relative', zIndex: 1 }} />
		</PopupManagerContext.Provider>
	);
}

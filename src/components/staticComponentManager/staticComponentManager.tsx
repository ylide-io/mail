import { createContext, Fragment, PropsWithChildren, ReactNode, useContext, useMemo, useState } from 'react';

interface StaticComponentManagerApi {
	show: (render: (onRemove: () => void) => ReactNode) => void;
}

export const StaticComponentManagerContext = createContext<StaticComponentManagerApi | undefined>(undefined);

export const useStaticComponentManager = () => useContext(StaticComponentManagerContext)!;

export function StaticComponentManager({ children }: PropsWithChildren) {
	const [modals, setModals] = useState<ReactNode[]>([]);

	const api = useMemo<StaticComponentManagerApi>(
		() => ({
			show: render => {
				const onRemove = () => setModals(m => m.filter(m => m !== modal));
				const modal = render(onRemove);

				setModals(m => [...m, modal]);
			},
		}),
		[],
	);

	return (
		<StaticComponentManagerContext.Provider value={api}>
			{children}

			{modals.map((m, i) => (
				<Fragment key={i}>{m}</Fragment>
			))}
		</StaticComponentManagerContext.Provider>
	);
}

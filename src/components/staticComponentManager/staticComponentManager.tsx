import { createContext, Fragment, PropsWithChildren, ReactNode, useContext, useMemo, useState } from 'react';

interface StaticComponentManagerApi {
	attach: (node: ReactNode) => void;
	remove: (node: ReactNode) => void;
}

export const StaticComponentManagerContext = createContext<StaticComponentManagerApi | undefined>(undefined);

export const useStaticComponentManager = () => useContext(StaticComponentManagerContext)!;

export function StaticComponentManager({ children }: PropsWithChildren) {
	const [nodes, setNodes] = useState<ReactNode[]>([]);

	const api = useMemo<StaticComponentManagerApi>(
		() => ({
			attach: node => setNodes(n => [...n, node]),
			remove: node => setNodes(prev => prev.filter(n => n !== node)),
		}),
		[],
	);

	return (
		<StaticComponentManagerContext.Provider value={api}>
			{children}

			{nodes.map((m, i) => (
				<Fragment key={i}>{m}</Fragment>
			))}
		</StaticComponentManagerContext.Provider>
	);
}

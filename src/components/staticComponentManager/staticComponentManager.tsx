import {
	createContext,
	createRef,
	Fragment,
	MutableRefObject,
	PropsWithChildren,
	ReactNode,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react';

interface StaticComponentManagerApi {
	attach: (node: ReactNode) => void;
	remove: (node: ReactNode) => void;
}

export const StaticComponentManagerContext = createContext<StaticComponentManagerApi | undefined>(undefined);

export const useStaticComponentManager = () => useContext(StaticComponentManagerContext)!;

//

let singletonStaticComponentKey = 0;

export function createSingletonStaticComponentHook<P>(factory: (props: P, onRemove: () => void) => ReactNode) {
	const nodeRef = createRef() as MutableRefObject<ReactNode>;

	return () => {
		const staticComponentManager = useStaticComponentManager();
		const resolveRef = useRef<() => void>();

		return (props: P) => {
			return new Promise<void>(resolve => {
				function removeCurrent() {
					if (nodeRef.current) {
						staticComponentManager.remove(nodeRef.current);
						nodeRef.current = undefined;
					}

					if (resolveRef.current) {
						resolveRef.current();
						resolveRef.current = undefined;
					}
				}

				removeCurrent();

				resolveRef.current = resolve;

				const node = factory({ key: `${Date.now()}${++singletonStaticComponentKey}`, ...props }, removeCurrent);
				nodeRef.current = node;
				staticComponentManager.attach(node);
			});
		};
	};
}

//

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

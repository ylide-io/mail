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

export function createSingletonStaticComponentHook<Props, Result = undefined>(
	factory: (props: Props, resolve: (data?: Result) => void) => ReactNode,
) {
	const nodeRef = createRef() as MutableRefObject<ReactNode>;

	return () => {
		const staticComponentManager = useStaticComponentManager();
		const resolveRef = useRef<(data: Result | undefined) => void>();

		return (props: Props) => {
			return new Promise<Result | undefined>(resolve => {
				function resolveCurrent(data?: Result) {
					if (nodeRef.current) {
						staticComponentManager.remove(nodeRef.current);
						nodeRef.current = undefined;
					}

					if (resolveRef.current) {
						resolveRef.current(data);
						resolveRef.current = undefined;
					}
				}

				resolveCurrent();

				resolveRef.current = resolve;

				const node = factory(
					{ key: `${Date.now()}${++singletonStaticComponentKey}`, ...props },
					resolveCurrent,
				);
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

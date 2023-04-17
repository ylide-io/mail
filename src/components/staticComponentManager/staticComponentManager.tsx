import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Fragment, ReactNode } from 'react';

let keyCounter = 0;

const staticComponents = observable<{ node: ReactNode; resolve: (data?: any) => void; singletonKey?: string }>([], {
	deep: false,
});

export function showStaticComponent<Result = undefined>(
	factory: (resolve: (data?: Result) => void) => ReactNode,
	options?: { singletonKey?: string },
) {
	return new Promise<Result | undefined>(resolve => {
		if (options?.singletonKey) {
			staticComponents.filter(c => c.singletonKey === options.singletonKey).forEach(it => it.resolve());

			staticComponents.replace(staticComponents.filter(c => c.singletonKey !== options.singletonKey));
		}

		const node = (
			<Fragment key={`StaticComponent${++keyCounter}`}>
				{factory(data => {
					staticComponents.replace(staticComponents.filter(c => c.node !== node));
					resolve(data);
				})}
			</Fragment>
		);

		staticComponents.push({ node, resolve: data => resolve(data), singletonKey: options?.singletonKey });
	});
}

export const StaticComponentManager = observer(() => (
	<>
		{staticComponents.map((item, i) => (
			<Fragment key={i}>{item.node}</Fragment>
		))}
	</>
));

import { observer } from 'mobx-react';
import { PropsWithChildren } from 'react';

import css from './regularPageContent.module.scss';

export interface RegularPageContentProps extends PropsWithChildren {}

export const RegularPageContent = observer(({ children }: RegularPageContentProps) => {
	return <div className={css.root}>{children}</div>;
});

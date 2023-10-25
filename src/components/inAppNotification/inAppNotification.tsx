import clsx from 'clsx';
import { observer } from 'mobx-react';
import { PropsWithChildren, ReactNode } from 'react';

import { UiStack, UiStackItemState } from '../../utils/uiStack';
import { Popup } from '../popup/popup';
import { PopupManagerPortalLevel } from '../popup/popupManager/popupManager';
import css from './inAppNotification.module.scss';

interface InAppNotificationProps extends PropsWithChildren {
	state: UiStackItemState;
}

function InAppNotification({ children, state }: InAppNotificationProps) {
	return (
		<Popup
			className={clsx(
				css.root,
				state === UiStackItemState.SHOWN && css.root_visible,
				state === UiStackItemState.HIDING && css.root_hidden,
			)}
			portalLevel={PopupManagerPortalLevel.UPPER}
		>
			{children}
		</Popup>
	);
}

//

const inAppNotificationsStack = new UiStack({
	displayTime: 1000 * 10,
	hidingTime: 1000,
});

export const InAppNotificationManager = observer(() => (
	<>
		{inAppNotificationsStack.stack.map(it => (
			<InAppNotification key={it.id} state={it.state}>
				{it.data}
			</InAppNotification>
		))}
	</>
));

export function inAppNotification(
	content: ReactNode,
	params?: {
		onClick?: () => void;
	},
) {
	const id = inAppNotificationsStack.push(
		<div
			className={clsx(css.content, params?.onClick && css.content_clickable)}
			onClick={() => {
				if (params?.onClick) {
					inAppNotificationsStack.hide(id);
					params?.onClick?.();
				}
			}}
		>
			{content}
		</div>,
	);
}

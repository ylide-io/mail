import clsx from 'clsx';
import { observer } from 'mobx-react';
import { PropsWithChildren, ReactNode } from 'react';

import { captureSentryExceptionWithId } from '../../utils/sentry';
import { UiStack, UiStackItemState } from '../../utils/uiStack';
import { ActionButton, ActionButtonLook } from '../actionButton/actionButton';
import { Popup } from '../popup/popup';
import { PopupManagerPortalLevel } from '../popup/popupManager/popupManager';
import css from './toast.module.scss';

interface ToastProps extends PropsWithChildren {
	state: UiStackItemState;
}

export function Toast({ children, state }: ToastProps) {
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

export namespace Toast {
	export const DISPLAY_TIME = 1000 * 5;
	export const HIDING_TIME = 1000;
}

//

const toastsStack = new UiStack({
	displayTime: Toast.DISPLAY_TIME,
	hidingTime: Toast.HIDING_TIME,
});

export const ToastManager = observer(() => (
	<>
		{toastsStack.stack.map(it => (
			<Toast key={it.id} state={it.state}>
				{it.data}
			</Toast>
		))}
	</>
));

export function toast(
	content: ReactNode,
	params?: {
		actionButton?: {
			text: ReactNode;
			onClick: () => void;
		};
		error?: string;
	},
) {
	toastsStack.push(
		<>
			{params?.actionButton ? (
				<div className={css.actionContent}>
					<div>{content}</div>

					<ActionButton look={ActionButtonLook.HEAVY} onClick={() => params.actionButton!.onClick()}>
						{params.actionButton.text}
					</ActionButton>
				</div>
			) : (
				<div>{content}</div>
			)}

			{params?.error != null && (
				<div className={css.errorId}>error · {captureSentryExceptionWithId(params.error)}</div>
			)}
		</>,
	);
}

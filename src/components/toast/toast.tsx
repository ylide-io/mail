import clsx from 'clsx';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { PropsWithChildren, ReactNode } from 'react';

import { captureSentryExceptionWithId } from '../../utils/sentry';
import { Popup } from '../popup/popup';
import { PopupManagerPortalLevel } from '../popup/popupManager/popupManager';
import css from './toast.module.scss';

enum ToastState {
	SHOWING,
	SHOWN,
	HIDING,
}

interface ToastProps extends PropsWithChildren<{}> {
	state: ToastState;
}

export function Toast({ children, state }: ToastProps) {
	return (
		<Popup
			className={clsx(
				css.root,
				state === ToastState.SHOWN && css.root_visible,
				state === ToastState.HIDING && css.root_hidden,
			)}
			portalLevel={PopupManagerPortalLevel.UPPER}
		>
			{children}
		</Popup>
	);
}

export namespace Toast {
	export const DISPLAY_TIME = 5000;
	export const HIDING_TIME = 1000;
}

//

let toastId = 0;

const toasts = observable<{ id: number; content: ReactNode; state: ToastState }>([]);

export function toast(content: ReactNode) {
	const id = ++toastId;

	toasts.replace(toasts.map(it => ({ ...it, state: ToastState.HIDING })));
	toasts.push({ id, content, state: ToastState.SHOWING });

	setTimeout(
		() =>
			toasts.replace(
				toasts.map(it =>
					it.id !== id || it.state !== ToastState.SHOWING ? it : { ...it, state: ToastState.SHOWN },
				),
			),
		100,
	);

	setTimeout(
		() =>
			toasts.replace(
				toasts.map(it =>
					it.id !== id || it.state !== ToastState.SHOWN ? it : { ...it, state: ToastState.HIDING },
				),
			),
		Toast.DISPLAY_TIME,
	);

	setTimeout(() => toasts.replace(toasts.filter(it => it.id !== id)), Toast.DISPLAY_TIME + Toast.HIDING_TIME);
}

export function toastWithErrorId(content: ReactNode, error: string) {
	toast(
		<>
			{content}
			<div className={css.errorId}>error · {captureSentryExceptionWithId(error)}</div>
		</>,
	);
}

export const ToastManager = observer(() => (
	<>
		{toasts.map(it => (
			<Toast key={it.id} state={it.state}>
				{it.content}
			</Toast>
		))}
	</>
));

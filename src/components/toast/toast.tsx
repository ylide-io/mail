import clsx from 'clsx';
import { createContext, PropsWithChildren, ReactNode, useContext, useMemo, useState } from 'react';

import { Popup } from '../popup/popup';
import css from './toast.module.scss';

let toastId = 0;

enum ToastState {
	SHOWING,
	SHOWN,
	HIDING,
}

interface ToastManagerApi {
	toast: (content: ReactNode) => void;
}

export const ToastManagerContext = createContext<ToastManagerApi | undefined>(undefined);

export const useToastManager = () => useContext(ToastManagerContext)!;

export function ToastManager({ children }: PropsWithChildren) {
	const [toasts, setToasts] = useState<Array<{ id: number; content: ReactNode; state: ToastState }>>([]);

	const api: ToastManagerApi = useMemo(
		() => ({
			toast: content => {
				const id = ++toastId;

				setToasts(prev => [
					...prev.map(it => ({ ...it, state: ToastState.HIDING })),
					{ id, content, state: ToastState.SHOWING },
				]);

				setTimeout(
					() =>
						setToasts(prev =>
							prev.map(it =>
								it.id !== id || it.state !== ToastState.SHOWING
									? it
									: { ...it, state: ToastState.SHOWN },
							),
						),
					100,
				);

				setTimeout(
					() =>
						setToasts(prev =>
							prev.map(it =>
								it.id !== id || it.state !== ToastState.SHOWN
									? it
									: { ...it, state: ToastState.HIDING },
							),
						),
					Toast.DISPLAY_TIME,
				);

				setTimeout(
					() => setToasts(prev => prev.filter(it => it.id !== id)),
					Toast.DISPLAY_TIME + Toast.HIDING_TIME,
				);
			},
		}),
		[],
	);

	return (
		<ToastManagerContext.Provider value={api}>
			{children}

			{toasts.map(it => (
				<Toast key={it.id} state={it.state}>
					{it.content}
				</Toast>
			))}
		</ToastManagerContext.Provider>
	);
}

//

interface ToastProps extends PropsWithChildren {
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
		>
			{children}
		</Popup>
	);
}

Toast.DISPLAY_TIME = 5000;
Toast.HIDING_TIME = 1000;

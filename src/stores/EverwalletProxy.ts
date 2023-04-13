import { nanoid } from 'nanoid';

import { decodeWidgetMessage, postWidgetMessage, WidgetMessageType } from '../pages/widgets/widgets';

export class EverwalletProxy {
	isProxyWalletAvailable(): Promise<boolean> {
		return new Promise(resolve => {
			const id = nanoid();

			const listener = (e: MessageEvent) => {
				const message = decodeWidgetMessage<{ id: string; result: boolean }>(e);
				if (message?.type === WidgetMessageType.EVER_PROXY_AVAILABILITY_RESULT && message.payload?.id === id) {
					window.removeEventListener('message', listener);

					resolve(message.payload.result);
				}
			};

			window.addEventListener('message', listener);

			postWidgetMessage(WidgetMessageType.EVER_PROXY_AVAILABILITY_REQUEST, { id });
		});
	}

	initializeEverwalletProxy() {
		(window as any).__everProxy = {
			request: async ({ method, params }: { method: string; params: any }) => {
				return new Promise((resolve, reject) => {
					const id = nanoid();

					const listener = (e: MessageEvent) => {
						const message = decodeWidgetMessage<{ id: string; result?: unknown; error?: unknown }>(e);
						if (message?.type === WidgetMessageType.EVER_WALLET_RESULT && message.payload?.id === id) {
							window.removeEventListener('message', listener);

							if (message.payload.error) {
								reject(message.payload.error);
							} else {
								resolve(message.payload.result);
							}
						}
					};

					window.addEventListener('message', listener);

					postWidgetMessage(WidgetMessageType.EVER_WALLET_REQUEST, { id, request: { method, params } });
				});
			},
		};
	}
}

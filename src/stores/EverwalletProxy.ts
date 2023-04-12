export class EverwalletProxy {
	handlers: Record<string, (...args: any) => void> = {};

	constructor() {
		if (window.parent !== window) {
			window.addEventListener('message', event => {
				this.handlers[event.data.id]?.(event.data);
			});
		}
	}

	isProxyWalletAvailable(): Promise<boolean> {
		const id = 'ewp' + Math.random() + '.' + Math.random();
		return new Promise(resolve => {
			this.handlers[id] = (data: any) => {
				resolve(data.result);
			};
			window.parent.postMessage({ fromWidget: true, id, type: 'isProxyWalletAvailable' }, '*');
		});
	}

	async initializeEverwalletProxy() {
		(window as any).__everProxy = {
			request: async ({ method, params }: { method: string; params: any }) => {
				const id = 'ewp' + Math.random() + '.' + Math.random();
				return new Promise((resolve, reject) => {
					this.handlers[id] = (data: any) => {
						if (data.error) {
							reject(data.error);
							return;
						} else {
							resolve(data.result);
						}
					};
					window.parent.postMessage(
						{ fromWidget: true, id, type: 'everwalletRequest', payload: { method, params } },
						'*',
					);
				});
			},
		};
	}
}

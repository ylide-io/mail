import { invariant } from '../../utils/assert';

export enum WidgetId {
	SEND_MESSAGE = 'SEND_MESSAGE',
	MAILBOX = 'MAILBOX',
}

export enum WidgetMessageType {
	EVER_PROXY_AVAILABILITY = 'EVER_PROXY_AVAILABILITY',
	EVER_WALLET_REQUEST = 'EVER_WALLET_REQUEST',

	SEND_MESSAGE__CLOSE = 'SEND_MESSAGE__CLOSE',

	MAILBOX__CLOSE = 'MAILBOX__CLOSE',
}

export interface WidgetMessage<Payload> {
	ylide: true;
	type: WidgetMessageType;
	payload?: Payload;
}

export function stringifyWidgetMessage<Payload>(type: WidgetMessageType, payload?: Payload) {
	return JSON.stringify({
		ylide: true,
		type,
		payload,
	} as WidgetMessage<Payload>);
}

export function postWidgetMessage<Payload>(type: WidgetMessageType, payload?: Payload) {
	window.parent.postMessage(stringifyWidgetMessage(type, payload), '*');
}

export function decodeWidgetMessage<Payload = unknown>(e: MessageEvent) {
	try {
		const json = JSON.parse(e.data) as WidgetMessage<Payload>;
		invariant(json.ylide);
		invariant(Object.values(WidgetMessageType).includes(json.type));
		return json;
	} catch (e) {
		return;
	}
}

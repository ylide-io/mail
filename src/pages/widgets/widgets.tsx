export enum WidgetId {
	SEND_MESSAGE = 'SEND_MESSAGE',
	MAILBOX = 'MAILBOX',
}

export enum WidgetEvent {
	CLOSE = 'CLOSE',
}

export interface WidgetMessage<Payload> {
	ylide: true;
	widget: WidgetId;
	event: WidgetEvent;
	payload?: Payload;
}

export function stringifyWidgetMessage<Payload>(widget: WidgetId, event: WidgetEvent, payload?: Payload) {
	return JSON.stringify({
		ylide: true,
		widget,
		event,
		payload,
	} as WidgetMessage<Payload>);
}

export function postWidgetMessage<Payload>(widget: WidgetId, event: WidgetEvent, payload?: Payload) {
	window.parent.postMessage(stringifyWidgetMessage(widget, event, payload), '*');
}

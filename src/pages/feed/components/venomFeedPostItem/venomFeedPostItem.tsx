import React, { useRef } from 'react';

import { AdaptiveAddress } from '../../../../components/adaptiveAddress/adaptiveAddress';
import { Avatar } from '../../../../components/avatar/avatar';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { ReactComponent as ContactSvg } from '../../../../icons/ic20/contact.svg';
import { ILinkedMessage } from '../../../../stores/MailList';
import css from './venomFeedPostItem.module.scss';

interface VenomFeedPostItemProps {
	message: ILinkedMessage;
}

export function VenomFeedPostItem({ message }: VenomFeedPostItemProps) {
	const selfRef = useRef<HTMLDivElement>(null);

	return (
		<div ref={selfRef} className={css.root}>
			<Avatar className={css.ava} placeholder={<ContactSvg width="100%" height="100%" />} />

			<div className={css.meta}>
				<AdaptiveAddress className={css.sender} address={message.msg.senderAddress} />

				<ReadableDate className={css.date} value={message.msg.createdAt * 1000} />
			</div>

			<div className={css.body}>content</div>
		</div>
	);
}

import { Avatar } from 'antd';
import React from 'react';

import { IContact } from '../../indexedDB/IndexedDB';
import { Blockie } from '../blockie/blockie';
import { PropsWithClassName } from '../props';

interface ContactAvatarProps extends PropsWithClassName {
	contact: IContact;
}

export function ContactAvatar({ className, contact }: ContactAvatarProps) {
	return (
		<div className={className}>
			{contact.img ? (
				<Avatar src={contact.img} style={{ width: '100%' }} />
			) : (
				<Blockie address={contact.address} style={{ width: '100%' }} />
			)}
		</div>
	);
}

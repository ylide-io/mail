import { IContact } from '../../indexedDB/IndexedDB';
import { Avatar } from '../avatar/avatar';
import { PropsWithClassName } from '../props';

interface ContactAvatarProps extends PropsWithClassName {
	contact: IContact;
}

export function ContactAvatar({ className, contact }: ContactAvatarProps) {
	return <Avatar className={className} image={contact.img} blockie={contact.address} />;
}

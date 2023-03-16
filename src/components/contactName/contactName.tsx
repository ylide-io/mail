import { observer } from 'mobx-react';

import contacts from '../../stores/Contacts';
import { AdaptiveAddress } from '../adaptiveAddress/adaptiveAddress';
import { AdaptiveText } from '../adaptiveText/adaptiveText';
import { PropsWithClassName } from '../propsWithClassName';

export interface ContactNameProps extends PropsWithClassName {
	address: string;
}

export const ContactName = observer(({ className, address }: ContactNameProps) => {
	const contact = contacts.contactsByAddress[address];

	return (
		<>
			{contact ? (
				<AdaptiveText className={className} text={contact.name} />
			) : (
				<AdaptiveAddress className={className} address={address} />
			)}
		</>
	);
});

import { observer } from 'mobx-react';

import { AdaptiveAddress } from '../../controls/adaptiveAddress/adaptiveAddress';
import { AdaptiveText } from '../../controls/adaptiveText/adaptiveText';
import contacts from '../../stores/Contacts';
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

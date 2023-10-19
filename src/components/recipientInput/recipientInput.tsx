import { observer } from 'mobx-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

import contacts from '../../stores/Contacts';
import { RecipientInputItem, Recipients } from '../../stores/outgoingMailData';
import { HorizontalAlignment } from '../../utils/alignment';
import { SEND_TO_ALL_ADDRESS } from '../../utils/globalFeed';
import { constrain } from '../../utils/number';
import { AdaptiveText } from '../adaptiveText/adaptiveText';
import { DropDown, DropDownItem, DropDownItemMode } from '../dropDown/dropDown';
import { TagInput, TagInputItem, TagInputItemLook } from '../tagInput/tagInput';

function splitSearchValue(search: string) {
	// 0x52e316e323c35e5b222ba63311433f91d80545ee
	// 0:d38e9ee2bbd975bb7c8f1e68c5ea3c2fb514e34073d2efbc0d296a2b439a3cc2
	// team.ylide
	return search.split(/[^\w:.-]/);
}

interface DropDownOption {
	name: string;
	address: string;
	isHighlighted: boolean;
}

interface RecipientInputProps {
	isReadOnly?: boolean;
	allowSendingToAll?: boolean;
	value: Recipients;
}

export const RecipientInput = observer(({ isReadOnly, allowSendingToAll, value }: RecipientInputProps) => {
	const tagInputRef = useRef(null);

	const [search, setSearch] = useState('');
	const [options, setOptions] = useState<DropDownOption[]>([]);
	const [isFocused, setFocused] = useState(false);

	// Build drop-down options
	useEffect(() => {
		if (!isFocused) {
			setOptions([]);
			return;
		}

		const cleanSearch = search.trim();

		const newOptions = contacts.contacts
			// Filter by Search value
			.filter(
				contact => !cleanSearch || contact.name.includes(cleanSearch) || contact.address.includes(cleanSearch),
			)

			// Filter already selected contacts out
			.filter(
				contact =>
					!value.items.some(
						it =>
							it.name === contact.name ||
							it.name === contact.address ||
							it.routing?.address === contact.address,
					),
			)

			.map((contact, i) => ({ name: contact.name, address: contact.address, isHighlighted: !i }));

		if (allowSendingToAll && !value.isSendingToAll && !cleanSearch) {
			newOptions.unshift({
				name: 'Send to all',
				address: SEND_TO_ALL_ADDRESS,
				isHighlighted: true,
			});

			newOptions.map((it, i) => (it.isHighlighted = !i));
		}

		setOptions(newOptions);
	}, [isFocused, allowSendingToAll, search, value.items, value.isSendingToAll]);

	//

	const onSearchChange = (newSearch: string) => {
		const items = splitSearchValue(newSearch);
		if (items.length > 1) {
			value.addItems(items);
			setSearch('');
		} else {
			setSearch(newSearch);
		}
	};

	const onFocus = () => {
		setFocused(true);
	};

	const onBlur = () => {
		value.addItems(splitSearchValue(search));
		setFocused(false);
		setSearch('');
	};

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		const keyCode = e.keyCode;

		// Enter
		if (keyCode === 13) {
			const highlightedOption = options.find(o => o.isHighlighted);
			const cleanSearch = search.trim();

			if (highlightedOption) {
				e.preventDefault();
				onSelect(highlightedOption);
			} else if (
				cleanSearch &&
				!value.items.some(it => it.name === cleanSearch || it.routing?.address === cleanSearch)
			) {
				e.preventDefault();
				value.items = [...value.items, Recipients.createItem(cleanSearch)];
			}

			setSearch('');
		}

		// Up, Down
		else if ((keyCode === 38 || keyCode === 40) && options.length) {
			e.preventDefault();

			if (options.length > 1) {
				const isDown = keyCode === 40;
				const currentIndex = options.findIndex(o => o.isHighlighted);
				const newIndex = constrain(isDown ? currentIndex + 1 : currentIndex - 1, 0, options.length - 1);

				setOptions(options.map((o, i) => ({ ...o, isHighlighted: i === newIndex })));
			}
		}
	};

	const onSelect = (option: DropDownOption) => {
		if (option.address === SEND_TO_ALL_ADDRESS || value.isSendingToAll) {
			value.items = [Recipients.createItem(option.name, { routing: { address: option.address } })];
		} else {
			value.items = [
				...value.items,
				Recipients.createItem(option.name, { routing: { address: option.address } }),
			];
		}
		setSearch('');
	};

	const onRemove = (item: RecipientInputItem) => {
		value.items = value.items.filter(it => it.id !== item.id);
	};

	return (
		<>
			<TagInput
				ref={tagInputRef}
				isReadOnly={isReadOnly}
				placeholder={!value.items.length ? 'Enter address or ENS domain here' : undefined}
				search={search}
				onSearchChange={onSearchChange}
				onFocus={onFocus}
				onBlur={onBlur}
				onKeyDown={onKeyDown}
			>
				{value.items?.map((item, i) => {
					const routing = item.routing;

					const tooltip = routing?.details
						? `We found ${
								routing.details.type === 'ylide' ? 'Ylide' : routing.details.type
						  } key suitable for receiving messages`
						: routing?.address === SEND_TO_ALL_ADDRESS
						? 'Message will be sent to all users'
						: !routing || routing.details === null
						? 'Public key of the recipient was not found'
						: undefined;

					return (
						<TagInputItem
							key={i}
							look={
								item.isLoading == null
									? TagInputItemLook.DEFAULT
									: item.isLoading
									? TagInputItemLook.LOADING
									: routing?.details || item.routing?.address === SEND_TO_ALL_ADDRESS
									? TagInputItemLook.SUCCESS
									: TagInputItemLook.ERROR
							}
							title={tooltip}
							onRemove={isReadOnly ? undefined : () => onRemove(item)}
						>
							<AdaptiveText text={item.name} />
						</TagInputItem>
					);
				})}
			</TagInput>

			{!!options.length && (
				<DropDown anchorRef={tagInputRef} horizontalAlign={HorizontalAlignment.MATCH}>
					{options.map((option, i) => (
						<DropDownItem
							key={i}
							mode={option.isHighlighted ? DropDownItemMode.HIGHLIGHTED : DropDownItemMode.REGULAR}
							onSelect={() => onSelect(option)}
						>
							{option.name}
						</DropDownItem>
					))}
				</DropDown>
			)}
		</>
	);
});

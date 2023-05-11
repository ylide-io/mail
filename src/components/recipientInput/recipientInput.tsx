import { autorun, makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

import contacts from '../../stores/Contacts';
import domain from '../../stores/Domain';
import { HorizontalAlignment } from '../../utils/alignment';
import { isAddress } from '../../utils/blockchain';
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

let itemIdCounter = Date.now();

export interface RecipientInputItem {
	id: string;
	name: string;
	isLoading?: boolean;
	routing?: {
		address?: string;
		details?: {
			type: string;
			blockchain: string | null;
		} | null;
	} | null;
}

export class Recipients {
	items: RecipientInputItem[] = [];

	constructor(initialItems?: string[]) {
		makeAutoObservable(this);

		autorun(() => {
			this.items.forEach(item => {
				if (item.isLoading) return;
				if (item.routing === null || item.routing?.details || item.routing?.details === null) return;

				item.isLoading = true;
				Recipients.processItem(item).finally(() => {
					item.isLoading = false;
				});
			});
		});

		if (initialItems?.length) {
			this.items = initialItems?.map(it => Recipients.createItem(it));
		}
	}

	static createItem(name: string, props: Partial<RecipientInputItem> = {}): RecipientInputItem {
		return {
			id: `${itemIdCounter++}`,
			name,
			...props,
		};
	}

	static async processItem(item: RecipientInputItem) {
		if (!item.routing?.address) {
			const contact = contacts.contacts.find(c => c.name === item.name || c.address === item.name);
			if (contact) {
				item.name = contact.name;
				item.routing = { address: contact.address };
			} else if (isAddress(item.name)) {
				item.routing = { address: item.name };
			} else {
				const nss = domain.getNSBlockchainsForAddress(item.name);
				for (const ns of nss) {
					const address = (await ns.service.resolve(item.name)) || undefined;
					if (address) {
						item.routing = { address };
						break;
					}
				}
			}
		}

		if (!item.routing) {
			item.routing = null;
			return;
		}

		if (item.routing.address && !item.routing.details) {
			const achievability = await domain.identifyAddressAchievability(item.routing.address);
			if (achievability) {
				item.routing.details = {
					type: achievability.type,
					blockchain: achievability.blockchain,
				};
			} else {
				item.routing.details = null;
			}
		}
	}
}

interface DropDownOption {
	name: string;
	address: string;
	isHighlighted: boolean;
}

interface RecipientInputProps {
	isReadOnly?: boolean;
	value: Recipients;
}

export const RecipientInput = observer(({ isReadOnly, value }: RecipientInputProps) => {
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

		setOptions(
			contacts.contacts
				// Filter by Search value
				.filter(
					contact =>
						!cleanSearch || contact.name.includes(cleanSearch) || contact.address.includes(cleanSearch),
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

				.map((contact, i) => ({ name: contact.name, address: contact.address, isHighlighted: !i })),
		);
	}, [isFocused, search, value.items]);

	//

	const addItems = (rawTerms: string[]) => {
		const cleanTerms = rawTerms.map(it => it.trim()).filter(Boolean);

		const items = cleanTerms
			.filter((term, i) => cleanTerms.indexOf(term) === i)
			.filter(item => !value.items.some(it => it.name === item || it.routing?.address === item))
			.map(item => Recipients.createItem(item));

		if (items.length) {
			value.items = [...value.items, ...items];
		}
	};

	const onSearchChange = (newSearch: string) => {
		const items = splitSearchValue(newSearch);
		if (items.length > 1) {
			addItems(items);
			setSearch('');
		} else {
			setSearch(newSearch);
		}
	};

	const onFocus = () => {
		setFocused(true);
	};

	const onBlur = () => {
		addItems(splitSearchValue(search));
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
		value.items = [...value.items, Recipients.createItem(option.name, { routing: { address: option.address } })];
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
									: routing?.details
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

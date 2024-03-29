import { Tooltip } from 'antd';
import { autorun, makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

import { AdaptiveText } from '../../controls/adaptiveText/adaptiveText';
import contacts from '../../stores/Contacts';
import domain from '../../stores/Domain';
import { HorizontalAlignment } from '../../utils/alignment';
import { isAddress, isEns } from '../../utils/blockchain';
import { constrain } from '../../utils/number';
import { DropDown, DropDownItem, DropDownItemMode } from '../dropDown/dropDown';
import { TagInput, TagInputItem, TagInputItemStyle } from '../tagInput/tagInput';

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
			} else if (isEns(item.name)) {
				const nss = domain.getNSBlockchainsForAddress(item.name);
				for (const ns of nss) {
					const address = (await ns.service.resolve(item.name)) || undefined;
					if (address) {
						item.routing = { address };
						break;
					}
				}
			} else if (isAddress(item.name)) {
				item.routing = { address: item.name };
			} else {
				item.routing = null;
				return;
			}
		}

		if (!item.routing?.details && item.routing?.address) {
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
	value: Recipients;
}

export const RecipientInput = observer(({ value }: RecipientInputProps) => {
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

	const onFocus = () => {
		setFocused(true);
	};

	const onBlur = () => {
		setFocused(false);

		const cleanSearch = search.trim();
		if (cleanSearch && !value.items.some(it => it.name === cleanSearch || it.routing?.address === cleanSearch)) {
			value.items = [...value.items, Recipients.createItem(cleanSearch)];
		}

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
				placeholder={!value.items.length ? 'Enter address or ENS domain here' : undefined}
				search={search}
				onSearchChange={setSearch}
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
						<Tooltip key={i} title={tooltip}>
							<TagInputItem
								style={
									item.isLoading == null
										? TagInputItemStyle.DEFAULT
										: item.isLoading
										? TagInputItemStyle.LOADING
										: routing?.details
										? TagInputItemStyle.SUCCESS
										: TagInputItemStyle.ERROR
								}
								onRemove={() => onRemove(item)}
							>
								<AdaptiveText text={item.name} />
							</TagInputItem>
						</Tooltip>
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

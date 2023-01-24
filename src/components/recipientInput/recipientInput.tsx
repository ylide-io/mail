import { Tooltip } from 'antd';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

import { AdaptiveText } from '../../controls/adaptiveText/adaptiveText';
import contacts from '../../stores/Contacts';
import domain from '../../stores/Domain';
import { HorizontalAlignment } from '../../utils/alignment';
import { isAddress, isEns } from '../../utils/blockchain';
import { DropDown, DropDownItem, DropDownItemMode } from '../dropDown/dropDown';
import { TagInput, TagInputItem, TagInputItemStyle } from '../tagInput/tagInput';

interface DropDownOption {
	name: string;
	address: string;
}

let itemIdCounter = Date.now();

function createItem(name: string, props: Partial<RecipientInputItem> = {}): RecipientInputItem {
	return {
		id: `${itemIdCounter++}`,
		name,
		...props,
	};
}

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

interface RecipientInputProps {
	initialValue?: string[];
	onChange: (value: RecipientInputItem[]) => void;
}

export function RecipientInput({ initialValue, onChange }: RecipientInputProps) {
	const tagInputRef = useRef(null);

	const [search, setSearch] = useState('');
	const [options, setOptions] = useState<DropDownOption[]>([]);
	const [isFocused, setFocused] = useState(false);

	const [items, setItems] = useState<RecipientInputItem[]>(initialValue?.map(v => createItem(v)) || []);

	useEffect(() => onChange(items), [items, onChange]);

	// Update item routing
	useEffect(() => {
		function patchItem(id: string, patch: Partial<RecipientInputItem>) {
			setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
		}

		items.forEach(async item => {
			if (item.isLoading) return;
			if (item.routing === null || item.routing?.details || item.routing?.details === null) return;

			patchItem(item.id, { isLoading: true });

			let name = item.name;
			let address = item.routing?.address;
			let details = item.routing?.details;

			if (!address) {
				const contact = contacts.contacts.find(c => c.name === item.name || c.address === item.name);
				if (contact) {
					name = contact.name;
					address = contact.address;
				} else if (isEns(item.name)) {
					const nss = domain.getNSBlockchainsForAddress(item.name);
					for (const ns of nss) {
						address = (await ns.service.resolve(item.name)) || undefined;
						if (address) break;
					}
				} else if (isAddress(item.name)) {
					address = item.name;
				}
			}

			if (!details && address) {
				const achievability = await domain.identifyAddressAchievability(address);
				if (achievability) {
					details = {
						type: achievability.type,
						blockchain: achievability.blockchain,
					};
				}
			}

			patchItem(item.id, {
				name,
				isLoading: false,
				routing: address ? { address, details: details || null } : null,
			});
		});
	}, [items]);

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
						!items.some(
							it =>
								it.name === contact.name ||
								it.name === contact.address ||
								it.routing?.address === contact.address,
						),
				)

				.map(contact => ({ name: contact.name, address: contact.address })),
		);
	}, [isFocused, items, search]);

	const onFocus = () => {
		setFocused(true);
	};

	const onBlur = () => {
		setFocused(false);

		const cleanSearch = search.trim();
		if (cleanSearch && !items.some(it => it.name === cleanSearch || it.routing?.address === cleanSearch)) {
			setItems([...items, createItem(cleanSearch)]);
		}

		setSearch('');
	};

	const onEnterKey = (e: KeyboardEvent<HTMLInputElement>) => {
		const firstOption = options[0];
		const cleanSearch = search.trim();

		if (firstOption) {
			e.preventDefault();
			onSelect(firstOption);
		} else if (cleanSearch && !items.some(it => it.name === cleanSearch || it.routing?.address === cleanSearch)) {
			e.preventDefault();
			setItems([...items, createItem(cleanSearch)]);
		}

		setSearch('');
	};

	const onSelect = (option: DropDownOption) => {
		setItems([...items, createItem(option.name, { routing: { address: option.address } })]);
		setSearch('');
	};

	const onRemove = (item: RecipientInputItem) => {
		setItems(items.filter(it => it.id !== item.id));
	};

	return (
		<>
			<TagInput
				ref={tagInputRef}
				placeholder={!items.length ? 'Enter address or ENS domain here' : undefined}
				search={search}
				onSearchChange={setSearch}
				onFocus={onFocus}
				onBlur={onBlur}
				onEnterKey={onEnterKey}
			>
				{items?.map((item, i) => {
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
							mode={i ? DropDownItemMode.REGULAR : DropDownItemMode.HIGHLIGHTED}
							onSelect={() => onSelect(option)}
						>
							{option.name}
						</DropDownItem>
					))}
				</DropDown>
			)}
		</>
	);
}

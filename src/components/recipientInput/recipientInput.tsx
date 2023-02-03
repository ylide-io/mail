import { Tooltip } from 'antd';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

import { AdaptiveText } from '../../controls/adaptiveText/adaptiveText';
import contacts from '../../stores/Contacts';
import domain from '../../stores/Domain';
import { HorizontalAlignment } from '../../utils/alignment';
import { isAddress, isEns } from '../../utils/blockchain';
import { constrain } from '../../utils/number';
import { DropDown, DropDownItem, DropDownItemMode } from '../dropDown/dropDown';
import { TagInput, TagInputItem, TagInputItemStyle } from '../tagInput/tagInput';

interface DropDownOption {
	name: string;
	address: string;
	isHighlighted: boolean;
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

	const [items, setItems] = useState<RecipientInputItem[]>(() => initialValue?.map(v => createItem(v)) || []);

	/*
	Since 'onChange' is being called in 'useEffect' callbacks,
	it should be listed as their deps. So it shouldn't change on every render.
	We need either use 'useCallback' outside of this component to cache 'onChange',
	or use Ref here.
	 */
	const onChangeRef = useRef(onChange);
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => onChangeRef.current?.(items), [items]);

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

				.map((contact, i) => ({ name: contact.name, address: contact.address, isHighlighted: !i })),
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
				!items.some(it => it.name === cleanSearch || it.routing?.address === cleanSearch)
			) {
				e.preventDefault();
				setItems([...items, createItem(cleanSearch)]);
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
				onKeyDown={onKeyDown}
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
}

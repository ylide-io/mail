import React from 'react';
import { Select, Tag, Spin, Tooltip, Menu, RefSelectProps } from 'antd';
import { autobind } from 'core-decorators';
import { observable, makeObservable, action } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';
import cn from 'classnames';
import contacts from '../../stores/Contacts';
import domain from '../../stores/Domain';
import { IRecipient } from '../../stores/Mailbox';

import { CheckOutlined } from '@ant-design/icons';

export interface IRecipientOption {
	id: string;
	type: 'contact' | 'custom';
	name: string;
	address: string | null;
}

export interface RecipientsSelectProps {
	mutableValues: IRecipient[];
}

@observer
export class RecipientsSelect extends PureComponent<RecipientsSelectProps> {
	@observable options: IRecipientOption[] = [];
	@observable search: string = '';

	selectRef = React.createRef<RefSelectProps>();

	constructor(props: RecipientsSelectProps) {
		super(props);

		makeObservable(this);
	}

	async loadRecipient(rec: IRecipient) {
		rec.loading = true;
		try {
			let address: string | null = null;
			if (rec.type === 'contact') {
				address = rec.address!;
			} else if (rec.type === 'ns') {
				const nss = domain.getNSBlockchainsForAddress(rec.input);
				for (const ns of nss) {
					const probableAddress = await ns.service.resolve(rec.input);
					if (probableAddress) {
						address = probableAddress;
						break;
					}
				}
			} else if (rec.type === 'address') {
				address = rec.address;
			} else {
				rec.isAchievable = false;
			}
			console.log('rec: ', JSON.stringify(rec));
			rec.address = address;
			if (address) {
				const ach = await domain.identifyAddressAchievability(address);
				if (!ach) {
					rec.isAchievable = false;
				} else {
					rec.isAchievable = {
						type: ach.type,
						blockchain: ach.blockchain,
					};
				}
			}
		} finally {
			rec.loading = false;
		}
	}

	isENS(input: string): boolean {
		return input.toLowerCase().endsWith('.eth');
	}

	isAddress(input: string): boolean {
		return domain.getBlockchainsForAddress(input.toLowerCase()).length > 0;
	}

	componentDidMount() {
		this.props.mutableValues.forEach(v => {
			if (v.isAchievable === null) {
				this.loadRecipient(v);
			}
		});
		this.updateOptions();
	}

	get values() {
		return this.props.mutableValues;
	}

	updateOptions() {
		this.options = (
			(this.search
				? [
						{
							id: 'search:null',
							type: 'custom',
							address: null,
							name: this.search,
						},
				  ]
				: []) as IRecipientOption[]
		).concat(
			contacts.contacts
				.map(v => ({
					id: `contact:${v.name}`,
					type: 'contact' as 'contact',
					address: v.address,
					name: v.name,
				}))
				.filter(o => o.name.toLowerCase().includes(this.search))
				.filter(o => !this.values.find(rec => rec.address === o.address)),
		);
	}

	@action.bound
	handleChange(values: string[]) {
		values = values.filter(v => v !== this.search);
		for (const value of values) {
			const rec = this.values.find(r => r.address === value || r.input === value);
			if (!rec) {
				const contact = contacts.contacts.find(c => c.name === value || c.address === value);
				if (contact) {
					this.values.push({
						loading: true,
						input: contact.name,
						type: 'contact',
						address: contact.address,
						isAchievable: null,
					});
					this.loadRecipient(this.values.at(-1)!);
				} else if (this.isENS(value)) {
					this.values.push({
						loading: true,
						input: value,
						type: 'ns',
						address: null,
						isAchievable: null,
					});
					this.loadRecipient(this.values.at(-1)!);
				} else if (this.isAddress(value)) {
					this.values.push({
						loading: true,
						input: value,
						type: 'address',
						address: value,
						isAchievable: null,
					});
					this.loadRecipient(this.values.at(-1)!);
				} else {
					this.values.push({
						loading: false,
						input: value,
						type: 'invalid',
						address: null,
						isAchievable: null,
					});
					this.loadRecipient(this.values.at(-1)!);
				}
			}
		}
		let i = 0;
		while (i < this.values.length) {
			const rec = this.values[i];
			const val = values.find(v => v === rec.input || v === rec.address);
			if (!val) {
				this.values.splice(i, 1);
				continue;
			}
			i++;
		}
		this.updateOptions();
	}

	@autobind
	handleSearch(val: string) {
		this.search = val;
		this.updateOptions();
		// console.log('search args: ', args);
	}

	render() {
		const values = this.values.slice().map(v => ({
			...v,
		}));
		const options = this.options.slice().map(o => ({
			...o,
		}));
		const search = this.search;
		return (
			<Select
				ref={this.selectRef}
				dropdownRender={menu => {
					return (
						<Menu
							onClick={item => {
								const opt = options[Number(item.key)];
								console.log('options: ', options);
								console.log('item click: ', opt);
								console.log('search: ', search);
								console.log('this.value: ', values);
								if (opt.id === 'search:null' && search === opt.name) {
									this.search = '';
									// this.selectRef.current?.focus();
								}
								if (values.find(t => t.input === opt.name)) {
									this.handleChange(values.filter(t => t.input !== opt.name).map(v => v.input));
								} else {
									this.handleChange(values.map(v => v.input).concat([opt.name]));
								}
								this.selectRef.current?.focus();
							}}
							items={options.map((r, idx) => {
								const isSelected = values.find(t => t.input === r.name);
								return {
									key: idx,
									icon: isSelected ? <CheckOutlined /> : null,
									label: r.name,
								};
							})}
						/>
					);
				}}
				tagRender={props => {
					const rec = values.find(r => r.input === props.value);
					const content = (
						<Tag
							className={cn('recipient-tag', {
								'achievable': !!rec?.isAchievable,
								'not-achievable': rec?.isAchievable === false,
							})}
							closable={true}
							onClose={props.onClose}
							key={props.value}
						>
							{rec?.loading ? <Spin size="small" /> : null}
							{props.label}
						</Tag>
					);
					let tooltipContent = 'Loading...';
					if (rec?.isAchievable) {
						tooltipContent = `We found ${
							rec.isAchievable.type === 'ylide' ? 'Ylide' : rec.isAchievable.type
						} key suitable for receiving messages`;
					} else {
						if (rec?.isAchievable === false) {
							tooltipContent = 'Public key of the recipient was not found';
						}
					}
					return <Tooltip title={tooltipContent}>{content}</Tooltip>;
				}}
				mode="tags"
				style={{ width: '100%' }}
				value={values.map(r => r.input)}
				autoClearSearchValue
				onDropdownVisibleChange={open => {
					console.log('open: ', open);
					if (!open) {
						this.search = '';
						setTimeout(() => this.updateOptions(), 200);
					}
				}}
				searchValue={this.search}
				onSearch={this.handleSearch}
				onChange={this.handleChange}
			/>
		);
	}
}

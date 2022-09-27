import React, { PureComponent } from 'react';
import { observer } from 'mobx-react';
import contacts from '../../../../stores/Contacts';
import cn from 'classnames';
// import { IContact } from '../../../../stores/models/IContact';
// import CreatableSelect from 'react-select/creatable';
// import mailbox from '../../../../stores/Mailbox';
// import domain from '../../../../stores/Domain';
import { makeObservable, observable } from 'mobx';
import { Select, Spin, Tag, Tooltip } from 'antd';
import { autobind } from 'core-decorators';
import domain from '../../../../stores/Domain';
import mailbox from '../../../../stores/Mailbox';

export interface IRecipient {
	loading: boolean;
	input: string;
	type: 'contact' | 'ns' | 'address' | 'invalid';
	address: string | null;
	isAchievable: boolean | null;
}

export interface IRecipientOption {
	id: string;
	type: 'contact';
	name: string;
	address: string;
}

// interface Option {
// 	value: number | string;
// 	label: string;
// 	__isNew__?: boolean;
// }

@observer
export class Recipients extends PureComponent {
	@observable recipients: IRecipient[] = [];
	@observable options: IRecipientOption[] = [];
	@observable search: string = '';

	constructor(props: {}) {
		super(props);

		makeObservable(this);
	}

	async loadRecipient(rec: IRecipient) {
		rec.loading = true;
		try {
			await new Promise(resolve => setTimeout(resolve, 500));
			rec.isAchievable = rec.input !== 'kirill.ylide';
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
		this.updateOptions();
	}

	updateOptions() {
		this.options = contacts.contacts
			.map(v => ({
				id: `contact:${v.name}`,
				type: 'contact' as 'contact',
				address: v.address,
				name: v.name,
			}))
			.filter(o => o.name.toLowerCase().includes(this.search))
			.filter(o => !this.recipients.find(rec => rec.address === o.address));
	}

	@autobind
	handleChange(values: string[], hz: any[]) {
		for (const value of values) {
			const rec = this.recipients.find(r => r.address === value || r.input === value);
			if (!rec) {
				const contact = contacts.contacts.find(c => c.name === value || c.address === value);
				if (contact) {
					this.recipients.push({
						loading: true,
						input: contact.name,
						type: 'contact',
						address: contact.address,
						isAchievable: null,
					});
					this.loadRecipient(this.recipients.at(-1)!);
				} else if (this.isENS(value)) {
					this.recipients.push({
						loading: true,
						input: value,
						type: 'ns',
						address: null,
						isAchievable: null,
					});
					this.loadRecipient(this.recipients.at(-1)!);
				} else if (this.isAddress(value)) {
					this.recipients.push({
						loading: true,
						input: value,
						type: 'address',
						address: value,
						isAchievable: null,
					});
					this.loadRecipient(this.recipients.at(-1)!);
				} else {
					this.recipients.push({
						loading: false,
						input: value,
						type: 'invalid',
						address: null,
						isAchievable: null,
					});
				}
			}
		}
		let i = 0;
		while (i < this.recipients.length) {
			const rec = this.recipients[i];
			const val = values.find(v => v === rec.input || v === rec.address);
			if (!val) {
				this.recipients.splice(i, 1);
				continue;
			}
			i++;
		}
		this.updateOptions();
		// @ts-ignore
		mailbox.recipients = this.recipients.filter(r => !!r.address).map(r => r.address);
	}

	@autobind
	handleSearch(val: string) {
		this.search = val;
		this.updateOptions();
		// console.log('search args: ', args);
	}

	render() {
		return (
			<>
				<div className="form-group row">
					<label className="col-sm-1 col-form-label">From:</label>
					<div className="col-sm-11" style={{ position: 'relative', zIndex: 2 }}>
						<Select style={{ width: '100%' }} value={'0'}>
							{domain.accounts.accounts.map((acc, idx) => (
								<Select.Option value={String(idx)}>
									{acc.account.address} [
									{acc.wallet.factory.wallet === 'web3' ? 'MetaMask' : 'EverWallet'}]
								</Select.Option>
							))}
						</Select>
					</div>
				</div>
				<div className="form-group row">
					<label className="col-sm-1 col-form-label">To:</label>
					<div className="col-sm-11" style={{ position: 'relative', zIndex: 2 }}>
						<Select
							tagRender={props => {
								const rec = this.recipients.find(r => r.input === props.value);
								console.log('rec render: ', rec);
								const content = (
									<Tag
										className={cn('recipient-tag', {
											'achievable': rec?.isAchievable === true,
											'not-achievable': rec?.isAchievable === false,
										})}
										closable={true}
										key={props.value}
									>
										{rec?.loading ? <Spin size="small" /> : null}
										{props.label}
									</Tag>
								);
								if (rec?.isAchievable === false) {
									return (
										<Tooltip title="Public key of the recipient was not found">{content}</Tooltip>
									);
								} else {
									return content;
								}
							}}
							mode="tags"
							style={{ width: '100%' }}
							value={this.recipients.map(r => r.input)}
							onSearch={this.handleSearch}
							onChange={this.handleChange}
						>
							{this.options.map((r, idx) => (
								<Select.Option value={r.address} key={idx}>
									{r.name}
								</Select.Option>
							))}
						</Select>
					</div>
				</div>
			</>
		);
	}
}

export default Recipients;

// const RecipientsEditor = observer(() => {
// 	const [value, setValue] = useState<Option[]>([]);

// 	useEffect(() => {
// 		const newValue = [];
// 		const foundContacts: IContact[] = [];

// 		for (const address of mailbox.recipients) {
// 			const contact = contacts.contactsByAddress[address];
// 			if (contact) {
// 				foundContacts.push(contact);
// 			} else {
// 				newValue.push({ value: address, label: address });
// 			}
// 		}

// 		for (const contact of foundContacts) {
// 			newValue.push(makeOption(contact));
// 		}

// 		setValue(newValue);
// 	}, []);

// 	const makeOption = (contact: IContact) => {
// 		return { value: contact.address, label: contact.name };
// 	};

// 	const fromOption = (option: Option) => {
// 		return contacts.contacts.find(contact => contact.address === option.value);
// 	};

// 	const options = contacts.contacts.map(tag => makeOption(tag));

// 	useEffect(() => {
// 		const recipientsAddresses: string[] = [];
// 		value.forEach(option => {
// 			const isAddress = domain.getBlockchainsForAddress(option.value.toString());
// 			if (isAddress.length) {
// 				recipientsAddresses.push(option.value.toString());
// 			} else {
// 				const address = fromOption(option)?.address;
// 				if (address) {
// 					recipientsAddresses.push(address);
// 				}
// 			}
// 		});
// 		mailbox.setRecipients(recipientsAddresses);
// 	}, [value]);

// 	const selectHandler = (options: readonly Option[]) => {
// 		setValue([...options]);
// 	};

// 	const createOption = (label: string) => ({
// 		label,
// 		value: label.toLowerCase(),
// 	});

// 	const handleCreate = async (inputValue: string) => {
// 		const isValid = await domain.getBlockchainsForAddress(inputValue);

// 		if (isValid.length) {
// 			const newOption = createOption(inputValue);
// 			setValue([...value, newOption]);
// 		}
// 	};

// 	return (
// 		<div className="form-group row">
// 			<label className="col-sm-1 col-form-label">To:</label>
// 			<div className="col-sm-11" style={{ position: 'relative', zIndex: 2 }}>
// 				<CreatableSelect
// 					isMulti={true}
// 					options={options}
// 					onChange={selectHandler}
// 					onCreateOption={handleCreate}
// 					placeholder={'Select recipients (or type correct address)'}
// 					value={value}
// 				/>
// 			</div>
// 		</div>
// 	);
// });

// export default RecipientsEditor;

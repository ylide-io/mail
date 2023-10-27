import { OutputData } from '@editorjs/editorjs';
import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { MessageAttachment, Uint256, YMF } from '@ylide/sdk';
import { autorun, makeAutoObservable, transaction } from 'mobx';

import { BlockchainFeedApi } from '../api/blockchainFeedApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../components/actionButton/actionButton';
import { ActionModal } from '../components/actionModal/actionModal';
import { AdaptiveText } from '../components/adaptiveText/adaptiveText';
import { SelectNetworkModal } from '../components/selectNetworkModal/selectNetworkModal';
import { showStaticComponent } from '../components/staticComponentManager/staticComponentManager';
import { HUB_FEED_ID, OTC_FEED_ID } from '../constants';
import { AppMode, REACT_APP__APP_MODE, REACT_APP__GLOBAL_FEED_ID } from '../env';
import { connectAccount } from '../utils/account';
import { invariant } from '../utils/assert';
import { blockchainMeta, evmNameToNetwork, isEvmBlockchain } from '../utils/blockchain';
import { calcComissionDecimals, calcCommission } from '../utils/commission';
import { SEND_TO_ALL_ADDRESS } from '../utils/globalFeed';
import { broadcastMessage, editorJsToYMF, isEmptyEditorJsData, sendMessage } from '../utils/mail';
import { truncateAddress } from '../utils/string';
import { getWalletSupportedBlockchains, isWalletSupportsBlockchain } from '../utils/wallet';
import contacts from './Contacts';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

const DEFAULT_FEED_ID = REACT_APP__APP_MODE === AppMode.OTC ? OTC_FEED_ID : HUB_FEED_ID;

//

let recipientIdCounter = Date.now();

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

	addItems(terms: string[]) {
		const cleanTerms = terms.map(it => it.trim()).filter(Boolean);

		const items = cleanTerms
			// filter out duplicates
			.filter((term, i) => cleanTerms.indexOf(term) === i)
			// filter out already selected items
			.filter(item => !this.items.some(it => it.name === item || it.routing?.address === item))
			// create items
			.map(item => Recipients.createItem(item));

		if (items.length) {
			this.items = [...this.items, ...items];
		}
	}

	get isSendingToAll() {
		return this.items.length === 1 && this.items[0].routing?.address === SEND_TO_ALL_ADDRESS;
	}

	static createItem(name: string, props: Partial<RecipientInputItem> = {}): RecipientInputItem {
		return {
			id: `${recipientIdCounter++}`,
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
			} else if (domain.isAddress(item.name)) {
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

//

export enum OutgoingMailDataMode {
	MESSAGE = 'MESSAGE',
	BROADCAST = 'BROADCAST',
}

export class OutgoingMailData {
	mode = OutgoingMailDataMode.MESSAGE;
	feedId = DEFAULT_FEED_ID;
	isGenericFeed = false;
	extraPayment = '0';

	private _from?: DomainAccount;
	private _blockchain?: string;
	to = new Recipients();

	subject = '';
	editorData?: OutputData;
	plainTextData = '';

	attachments: MessageAttachment[] = [];
	attachmentFiles: File[] = [];

	validator?: () => boolean;
	processContent?: (ymf: YMF) => YMF;
	sending = false;

	constructor() {
		makeAutoObservable(this);

		autorun(async () => {
			if (!this.from || !domain.accounts.activeAccounts.includes(this.from)) {
				this.from = domain.accounts.activeAccounts[0];
			}

			if (this.from) {
				const newChain = await this.from.getActiveBlockchain();
				const supportedChains = getWalletSupportedBlockchains(this.from.wallet);

				if (this.blockchain == null || !supportedChains.includes(this.blockchain)) {
					this.blockchain =
						newChain && supportedChains.includes(newChain)
							? newChain
							: this.from.wallet.currentBalances.getFirstNonZeroChain() || supportedChains[0];
				}
			}
		});
	}

	get from() {
		return this._from;
	}

	set from(account: DomainAccount | undefined) {
		this._from = account;
	}

	get blockchain() {
		return this._blockchain;
	}

	set blockchain(chain: string | undefined) {
		invariant(
			!chain || (this.from && isWalletSupportsBlockchain(this.from.wallet, chain)),
			`FROM account doesn't support [${chain}] chain`,
		);

		this._blockchain = chain;
	}

	get hasEditorData() {
		return !isEmptyEditorJsData(this.editorData);
	}

	get hasPlainTextData() {
		return !!this.plainTextData.trim();
	}

	reset(data?: {
		mode?: OutgoingMailDataMode;
		feedId?: Uint256;
		isGenericFeed?: boolean;
		extraPayment?: string;

		from?: DomainAccount;
		blockchain?: string;
		to?: Recipients;

		subject?: string;
		editorData?: OutputData;
		plainTextData?: string;

		attachments?: MessageAttachment[];
		attachmentFiles?: File[];
	}) {
		transaction(() => {
			this.mode = data?.mode || OutgoingMailDataMode.MESSAGE;
			this.feedId = data?.feedId || DEFAULT_FEED_ID;
			this.isGenericFeed = data?.isGenericFeed || false;
			this.extraPayment = data?.extraPayment || '0';

			this.from = data?.from;
			this.blockchain = data?.blockchain;
			this.to = data?.to || new Recipients();

			this.subject = data?.subject || '';
			this.editorData = data?.editorData;
			this.plainTextData = data?.plainTextData || '';

			this.attachments = data?.attachments || [];
			this.attachmentFiles = data?.attachmentFiles || [];
		});
	}

	get readyForSending() {
		return !!(
			// shouldn't be sending already
			(
				!this.sending &&
				// should either broadcasting or have recipients
				(this.mode === OutgoingMailDataMode.BROADCAST ||
					// should have recipients
					(this.to.items.length &&
						// all recipients should be loaded
						!this.to.items.some(r => r.isLoading) &&
						// all recipients should have routing, or it should be sending to all
						(!this.to.items.some(r => !r.routing?.details) || this.to.isSendingToAll))) &&
				// need to have content
				(this.hasEditorData || this.hasPlainTextData || this.attachments.length || this.attachmentFiles.length)
			)
		);
	}

	/**
	 * Returns TRUE - message sent succesfully.
	 * Returns FALSE - sending was aborted by user.
	 * Throws ERROR - error occured.
	 */
	async send(): Promise<boolean> {
		try {
			invariant(this.readyForSending, 'Not ready for sending');

			if (this.validator?.() === false) return false;

			this.sending = true;

			// CHECK 'FROM'

			const proxyAccount = domain.availableProxyAccounts[0];

			if (!this.from) {
				const account = await connectAccount({ place: 'sending-message' });
				if (!account) return false;

				this.from = account;

				if (account.wallet.factory.blockchainGroup === 'evm') {
					const network: EVMNetwork | undefined = await showStaticComponent(resolve => (
						<SelectNetworkModal wallet={account.wallet} account={account.account} onClose={resolve} />
					));

					const chain = network != null ? EVM_NAMES[network] : undefined;
					if (!chain) return false;

					this.blockchain = chain;
				}
			} else if (proxyAccount && proxyAccount.account.address !== this.from.account.address) {
				const proceed = await showStaticComponent<boolean>(resolve => (
					<ActionModal
						title="Different accounts"
						buttons={[
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.PRIMARY}
								onClick={() => resolve(true)}
							>
								Continue with {truncateAddress(this.from!.account.address)}
							</ActionButton>,
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.LITE}
								onClick={() => resolve(false)}
							>
								Cancel
							</ActionButton>,
						]}
						onClose={resolve}
					>
						You're going to send the message using
						<br />
						<b>
							<AdaptiveText text={this.from!.account.address} />
						</b>
						<br />
						But the parent application uses
						<br />
						<b>
							<AdaptiveText text={proxyAccount.account.address} />
						</b>
						<br />
						Are you sure you want to continue sending the message?
					</ActionModal>
				));

				if (!proceed) return false;
			}

			invariant(this.from);

			// Ensure that chain is selected correctly,
			// or request to switch it.
			if (this.from.wallet.currentBlockchain !== this.blockchain) {
				invariant(
					isEvmBlockchain(this.blockchain),
					`Cannot change change chain for non-EVM wallet: '${this.from.wallet.wallet}' / Required chain: '${this.blockchain}'`,
				);

				await domain.switchEVMChain(this.from.wallet, evmNameToNetwork(this.blockchain)!);

				const newChain = await this.from.wallet.controller.getCurrentBlockchain();
				invariant(
					newChain === this.blockchain,
					`Chain is still incorrect after programmatical switching: '${newChain}' / Required: '${this.blockchain}'`,
				);
			}

			// Ensure that account is selected correctly.
			// Do it after switching the chain, because chain switching opens wallet app,
			// and asking for chaing account - doesn't.
			const curr = await this.from.wallet.getCurrentAccount();
			if (curr?.address !== this.from.account.address) {
				await domain.handleSwitchRequest(this.from.wallet.factory.wallet, curr, this.from.account);
			}

			// PREPARE CONTENT

			let content: YMF;
			if (this.hasEditorData) {
				content = editorJsToYMF(this.editorData);
			} else {
				content = YMF.fromPlainText(this.plainTextData.trim());
			}

			if (this.processContent) {
				content = this.processContent(content);
			}

			// SEND

			const isSendingToAll = this.to.isSendingToAll;
			const feedId = isSendingToAll ? REACT_APP__GLOBAL_FEED_ID : this.feedId;

			if (this.mode === OutgoingMailDataMode.MESSAGE && !isSendingToAll) {
				const result = await sendMessage({
					sender: this.from,
					subject: this.subject,
					text: content,
					attachments: this.attachments,
					attachmentFiles: this.attachmentFiles,
					recipients: this.to.items.map(r => r.routing?.address!),
					blockchain: this.blockchain,
					feedId,
				});

				console.log('Sending result: ', result);
			} else {
				const blockchain = this.blockchain;
				invariant(blockchain, 'Chain not defined');

				if (this.isGenericFeed) {
					const commissions = await BlockchainFeedApi.getCommissions({ feedId: feedId });
					const commission = calcCommission(blockchain, commissions);
					invariant(commission === this.extraPayment, 'Commissions mismatch');
				}

				const result = await broadcastMessage({
					sender: this.from,
					subject: this.subject,
					text: content,
					attachments: this.attachments,
					attachmentFiles: this.attachmentFiles,
					feedId,
					isGenericFeed: this.isGenericFeed,
					extraPayment: this.isGenericFeed
						? blockchain === 'everscale' || blockchain === 'venom-testnet'
							? this.extraPayment
							: calcComissionDecimals(
									this.extraPayment,
									blockchainMeta[blockchain].ethNetwork?.nativeCurrency.decimals || 9,
							  )
						: '0',
					value: this.isGenericFeed
						? blockchain === 'everscale' || blockchain === 'venom-testnet'
							? this.extraPayment
							: calcComissionDecimals(
									this.extraPayment,
									blockchainMeta[blockchain].ethNetwork?.nativeCurrency.decimals || 9,
							  )
						: '0',
					blockchain: blockchain,
				});

				console.log('Sending result: ', result);
			}

			return true;
		} catch (e) {
			console.error('Error sending message', e);
			throw e;
		} finally {
			this.sending = false;
		}
	}
}

//

let globalOutgoingMailDataX: OutgoingMailData | undefined;

export function getGlobalOutgoingMailData() {
	return (globalOutgoingMailDataX = globalOutgoingMailDataX || new OutgoingMailData());
}

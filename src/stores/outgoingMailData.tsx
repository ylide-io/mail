import { OutputData } from '@editorjs/editorjs';
import { EVMNetwork } from '@ylide/ethereum';
import { MessageAttachment, Uint256, YMF } from '@ylide/sdk';
import { autorun, makeAutoObservable, transaction } from 'mobx';

import { BlockchainFeedApi } from '../api/blockchainFeedApi';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../components/ActionButton/ActionButton';
import { ActionModal } from '../components/actionModal/actionModal';
import { AdaptiveText } from '../components/adaptiveText/adaptiveText';
import { Recipients } from '../components/recipientInput/recipientInput';
import { SelectNetworkModal } from '../components/selectNetworkModal/selectNetworkModal';
import { showStaticComponent } from '../components/staticComponentManager/staticComponentManager';
import { toast } from '../components/toast/toast';
import { HUB_FEED_ID, OTC_FEED_ID } from '../constants';
import { AppMode, REACT_APP__APP_MODE } from '../env';
import { connectAccount } from '../utils/account';
import { invariant } from '../utils/assert';
import { blockchainMeta } from '../utils/blockchain';
import { calcComissionDecimals, calcComissions } from '../utils/calcComissions';
import { broadcastMessage, editorJsToYMF, isEmptyEditorJsData, sendMessage } from '../utils/mail';
import { truncateInMiddle } from '../utils/string';
import { getEvmWalletNetwork } from '../utils/wallet';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

const DEFAULT_FEED_ID = REACT_APP__APP_MODE === AppMode.OTC ? OTC_FEED_ID : HUB_FEED_ID;

export enum OutgoingMailDataMode {
	MESSAGE = 'MESSAGE',
	BROADCAST = 'BROADCAST',
}

export class OutgoingMailData {
	mode = OutgoingMailDataMode.MESSAGE;
	feedId = DEFAULT_FEED_ID;
	isGenericFeed = false;
	extraPayment: string = '0';

	from?: DomainAccount;
	to = new Recipients();
	network?: EVMNetwork;

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

		autorun(() => {
			this.from =
				this.from && domain.accounts.activeAccounts.includes(this.from)
					? this.from
					: domain.accounts.activeAccounts[0];
		});
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
		to?: Recipients;
		network?: EVMNetwork;

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

			this.from = data?.from || domain.accounts.activeAccounts[0];
			this.to = data?.to || new Recipients();
			this.network = data?.network;

			this.subject = data?.subject || '';
			this.editorData = data?.editorData;
			this.plainTextData = data?.plainTextData || '';

			this.attachments = data?.attachments || [];
			this.attachmentFiles = data?.attachmentFiles || [];
		});
	}

	get readyForSending() {
		return !!(
			!this.sending &&
			(this.mode === OutgoingMailDataMode.BROADCAST ||
				(this.to.items.length &&
					!this.to.items.some(r => r.isLoading) &&
					!this.to.items.some(r => !r.routing?.details))) &&
			(this.hasEditorData || this.hasPlainTextData || this.attachments.length || this.attachmentFiles.length)
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

			const proxyAccount = domain.availableProxyAccounts[0];

			if (!this.from) {
				this.from = await connectAccount({ place: 'sending-message' });
				if (!this.from) return false;

				if (this.from.wallet.factory.blockchainGroup === 'evm') {
					const from = this.from;

					this.network = await showStaticComponent(resolve => (
						<SelectNetworkModal wallet={from.wallet} account={from.account} onClose={resolve} />
					));

					if (this.network == null) return false;
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
								Continue with {truncateInMiddle(this.from!.account.address, 8, '...')}
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

			if (
				this.from.wallet.factory.blockchainGroup === 'evm' &&
				(await getEvmWalletNetwork(this.from.wallet)) == null
			) {
				toast(
					<>
						<b>Unsupported EVM network 😒</b>
						<div>Please select another one and try again.</div>
					</>,
				);
				return false;
			}

			const curr = await this.from.wallet.getCurrentAccount();
			if (curr?.address !== this.from.account.address) {
				await domain.handleSwitchRequest(this.from.wallet.factory.wallet, curr, this.from.account);
			}

			let content: YMF;
			if (this.hasEditorData) {
				content = editorJsToYMF(this.editorData);
			} else {
				content = YMF.fromPlainText(this.plainTextData.trim());
			}

			if (this.processContent) {
				content = this.processContent(content);
			}

			if (this.mode === OutgoingMailDataMode.MESSAGE) {
				const result = await sendMessage({
					sender: this.from,
					subject: this.subject,
					text: content,
					attachments: this.attachments,
					attachmentFiles: this.attachmentFiles,
					recipients: this.to.items.map(r => r.routing?.address!),
					network: this.network,
					feedId: this.feedId,
				});

				console.log('Sending result: ', result);
			} else {
				const blockchain = this.from.getBlockchainName(this.network);
				if (this.isGenericFeed) {
					const comissions = await BlockchainFeedApi.getComissions({ feedId: this.feedId });
					const comission = calcComissions(blockchain, comissions);
					invariant(comission === this.extraPayment, 'Comissions mismatch');
				}
				const result = await broadcastMessage({
					sender: this.from,
					subject: this.subject,
					text: content,
					attachments: this.attachments,
					attachmentFiles: this.attachmentFiles,
					feedId: this.feedId,
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
					network: this.network,
				});

				console.log('Sending result: ', result);
			}

			return true;
		} catch (e) {
			console.log('Error sending message', e);
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

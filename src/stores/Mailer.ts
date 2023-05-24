import { EVMNetwork } from '@ylide/ethereum';
import {
	MessageAttachmentLinkV1,
	MessageAttachmentType,
	MessageContentV4,
	MessageSecureContext,
	SendMailResult,
	ServiceCode,
	Uint256,
	YlideIpfsStorage,
	YMF,
} from '@ylide/sdk';
import { makeObservable, observable } from 'mobx';

import { readFileAsArrayBuffer } from '../utils/file';
import { getEvmWalletNetwork } from '../utils/wallet';
import { analytics } from './Analytics';
import domain from './Domain';
import { DomainAccount } from './models/DomainAccount';

class Mailer {
	@observable sending = false;

	constructor() {
		makeObservable(this);
	}

	async sendMail(
		sender: DomainAccount,
		subject: string,
		text: YMF,
		attachments: File[],
		recipients: string[],
		network?: EVMNetwork,
		feedId?: Uint256,
	): Promise<SendMailResult | null> {
		let error = false;
		analytics.mailSentAttempt();
		try {
			this.sending = true;

			const secureContext = MessageSecureContext.create();
			const ipfsStorage = new YlideIpfsStorage();

			const messageAttachments = await Promise.all(
				attachments.map(async file => {
					const buffer = await readFileAsArrayBuffer(file);
					const uint8Array = new Uint8Array(buffer);
					const encrypted = secureContext.encrypt(uint8Array);
					const uploaded = await ipfsStorage.uploadToIpfs(encrypted);

					return new MessageAttachmentLinkV1({
						type: MessageAttachmentType.LINK_V1,
						previewLink: '',
						link: `ipfs://${uploaded.hash}`,
						fileName: file.name,
						fileSize: file.size,
						isEncrypted: true,
					});
				}),
			);

			const content = new MessageContentV4({
				sendingAgentName: 'ysh',
				sendingAgentVersion: { major: 1, minor: 0, patch: 0 },
				subject,
				content: text,
				attachments: messageAttachments,
				extraBytes: new Uint8Array(0),
				extraJson: {},
			});

			if (!network && sender.wallet.factory.blockchainGroup === 'evm') {
				network = await getEvmWalletNetwork(sender.wallet);
			}

			return await domain.ylide.core.sendMessage(
				{
					wallet: sender.wallet.controller,
					sender: sender.account,
					content,
					recipients,
					secureContext,
					serviceCode: ServiceCode.MAIL,
					feedId,
				},
				{
					network,
				},
			);
		} catch (e) {
			error = true;
			throw e;
		} finally {
			if (!error) {
				analytics.mailSentSuccessful();
			}
			this.sending = false;
		}
	}
}

//@ts-ignore
const mailer = (window.mailer = new Mailer());
export default mailer;

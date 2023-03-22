import { NFT3Client } from '@nft3sdk/client';
import { AbstractNameService } from '@ylide/sdk';

export class NFT3NameService extends AbstractNameService {
	private client = new NFT3Client('https://t0.onebitdev.com/nft3-gateway/');

	constructor() {
		super();
	}

	isCandidate(name: string): boolean {
		return name.toLowerCase().endsWith('.isme');
	}

	async resolve(name: string): Promise<string | null> {
		try {
			const info = await this.client.did.info(this.client.did.convertName(name));
			const ethAddress = info.addresses.find(address => address.startsWith('ethereum:'));
			return ethAddress ? ethAddress.split(':')[1] : null;
		} catch (err) {
			return null;
		}
	}

	async reverseResolve(address: string): Promise<string | null> {
		try {
			const results = await this.client.did.search({ mode: 'address', keyword: address });
			return results.length > 0 ? `${results[0].identifier}.isme` : null;
		} catch (err) {
			return null;
		}
	}
}

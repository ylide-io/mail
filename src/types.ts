export type MainviewKeyPayload = {
	signature: string;
	timestamp: number;
	invite: string;
	address: string;
	publicKeyHex?: string;
	signatureDataHash?: string;
	tvmType?: 'venomwallet' | 'everwallet';
};

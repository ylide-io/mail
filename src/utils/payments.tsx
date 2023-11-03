import { FeedManagerApi } from '../api/feedManagerApi';
import { DomainAccount } from '../stores/models/DomainAccount';
import { invariant } from './assert';

const PAYMENT_RESULT_PARAM = 'payment_result';
const PAYMENT_ACCOUNT_PARAM = 'payment_account';

export enum PaymentResult {
	SUCCESS = 'success',
	CANCEL = 'cancel',
}

function buildUrlWithGetParams(params: Record<string, string>) {
	const url = new URL(window.location.href);

	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.set(key, value);
	});

	return url.href;
}

function buildReturnUrl(account: DomainAccount, isSuccess: boolean) {
	return buildUrlWithGetParams({
		[PAYMENT_ACCOUNT_PARAM]: account.account.address,
		[PAYMENT_RESULT_PARAM]: isSuccess ? PaymentResult.SUCCESS : PaymentResult.CANCEL,
	});
}

export async function checkout(account: DomainAccount, type: FeedManagerApi.PaymentType) {
	const token = account.mainViewKey;
	invariant(token, 'No MV key');

	const res = await FeedManagerApi.checkout({
		token,
		type,
		success_url: buildReturnUrl(account, true),
		cancel_url: buildReturnUrl(account, false),
	});

	const checkoutUrl = res.url;
	invariant(checkoutUrl, 'Checkout URL was not received');

	location.href = checkoutUrl;

	return true;
}

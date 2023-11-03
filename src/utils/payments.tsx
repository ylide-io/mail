import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedManagerApi } from '../api/feedManagerApi';
import { DomainAccount } from '../stores/models/DomainAccount';
import { invariant } from './assert';
import { useNav } from './url';

const PAYMENT_ADDRESS_PARAM = 'payment_address';
const PAYMENT_RESULT_PARAM = 'payment_result';

export enum CheckoutResult {
	SUCCESS = 'success',
	CANCEL = 'cancel',
}

export function useCheckoutSearchParams() {
	const [searchParams] = useSearchParams();
	const navigate = useNav();

	return useMemo(
		() => ({
			address: searchParams.get(PAYMENT_ADDRESS_PARAM) || '',
			result: searchParams.get(PAYMENT_RESULT_PARAM) || '',
			reset: () => {
				const url = new URL(window.location.href);
				url.searchParams.delete(PAYMENT_ADDRESS_PARAM);
				url.searchParams.delete(PAYMENT_RESULT_PARAM);
				navigate(url.href, { replace: true });
			},
		}),
		[navigate, searchParams],
	);
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
		[PAYMENT_ADDRESS_PARAM]: account.account.address,
		[PAYMENT_RESULT_PARAM]: isSuccess ? CheckoutResult.SUCCESS : CheckoutResult.CANCEL,
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

//

export function getActiveSubscription(paymentInfo?: FeedManagerApi.PaymentInfo) {
	return paymentInfo?.subscriptions.find(sub => sub.status === FeedManagerApi.PaymentSubscriptionStatus.ACTIVE);
}

export function getActiveCharge(paymentInfo?: FeedManagerApi.PaymentInfo) {
	return paymentInfo?.charges.find(
		charge =>
			charge.status === FeedManagerApi.PaymentChargeStatus.SUCCEEDED && charge.endOfPeriod > Date.now() / 1000,
	);
}

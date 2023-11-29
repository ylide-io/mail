import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FeedManagerApi } from '../api/feedManagerApi';
import { DomainAccount } from '../stores/models/DomainAccount';
import { invariant } from './assert';
import { useNav } from './url';

const PAYMENT_ADDRESS_PARAM = 'payment_address';
const PAYMENT_RESULT_PARAM = 'payment_result';
const PAYMENT_MONTHS_PARAM = 'payment_months';

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
			months: searchParams.get(PAYMENT_MONTHS_PARAM) || '',
			reset: () => {
				const url = new URL(window.location.href);
				url.searchParams.delete(PAYMENT_ADDRESS_PARAM);
				url.searchParams.delete(PAYMENT_RESULT_PARAM);
				url.searchParams.delete(PAYMENT_MONTHS_PARAM);
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

function buildReturnUrl(account: DomainAccount, isSuccess: boolean, months: number) {
	return buildUrlWithGetParams({
		[PAYMENT_ADDRESS_PARAM]: account.account.address,
		[PAYMENT_RESULT_PARAM]: isSuccess ? CheckoutResult.SUCCESS : CheckoutResult.CANCEL,
		[PAYMENT_MONTHS_PARAM]: months.toString(),
	});
}

export async function checkout(account: DomainAccount, months: number) {
	const token = account.mainViewKey;
	invariant(token, 'No MV key');

	const res = await FeedManagerApi.checkout({
		token,
		months,
		success_url: buildReturnUrl(account, true, months),
		cancel_url: buildReturnUrl(account, false, months),
	});

	const checkoutUrl = res.url;
	invariant(checkoutUrl, 'Checkout URL was not received');

	location.href = checkoutUrl;

	// Don't resolve this function since we're going another URL
	return new Promise(() => {});
}

//

export function getActiveSubscriptions(paymentInfo?: FeedManagerApi.PaymentInfo) {
	return (
		paymentInfo?.subscriptions.filter(
			sub =>
				sub.status === FeedManagerApi.PaymentSubscriptionStatus.ACTIVE && sub.next_charge > Date.now() / 1000,
		) || []
	);
}

export function getActiveCharges(paymentInfo?: FeedManagerApi.PaymentInfo) {
	return (
		paymentInfo?.charges.filter(
			charge =>
				charge.status === FeedManagerApi.PaymentChargeStatus.SUCCEEDED &&
				charge.endOfPeriod > Date.now() / 1000,
		) || []
	);
}

export function isPaid(paymentInfo?: FeedManagerApi.PaymentInfo) {
	return !!getActiveSubscriptions(paymentInfo).length || !!getActiveCharges(paymentInfo).length;
}

export function isTrialActive(paymentInfo?: FeedManagerApi.PaymentInfo) {
	return paymentInfo?.status.active && !isPaid(paymentInfo);
}

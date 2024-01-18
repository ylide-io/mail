import { FeedManagerApi } from '../api/feedManagerApi';

export function isPaid(plan?: FeedManagerApi.AccountPlan) {
	return plan?.plan === 'basic' || plan?.plan === 'pro';
}

export function isTrialActive(plan?: FeedManagerApi.AccountPlan) {
	return plan?.plan === 'trial';
}

export function isInactivePlan(plan?: FeedManagerApi.AccountPlan) {
	return plan?.plan === 'none';
}

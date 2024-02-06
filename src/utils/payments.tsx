import { MainviewApi } from '../api/mainviewApi';

export function isPaid(plan?: MainviewApi.AccountPlan) {
	return plan?.plan === 'basic' || plan?.plan === 'pro';
}

export function isTrialActive(plan?: MainviewApi.AccountPlan) {
	return plan?.plan === 'trial';
}

export function isInactivePlan(plan?: MainviewApi.AccountPlan) {
	return plan?.plan === 'none';
}

import { MainviewApi } from '../api/mainviewApi';

export function isPaid(plan: MainviewApi.AccountPlan | null) {
	return plan?.plan === 'basic' || plan?.plan === 'pro';
}

export function isTrialActive(plan: MainviewApi.AccountPlan | null) {
	return plan?.plan === 'trial';
}

export function isInactivePlan(plan: MainviewApi.AccountPlan | null) {
	return plan?.plan === 'none';
}

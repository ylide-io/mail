import { observer } from 'mobx-react';
import { useQuery } from 'react-query';

import { MainviewApi } from '../../../api/mainviewApi';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import domain from '../../../stores/Domain';
import { DomainAccount } from '../../../stores/models/DomainAccount';
import { DateFormatStyle, formatDate } from '../../../utils/date';
import { constrain } from '../../../utils/number';
import { isPaid, isTrialActive } from '../../../utils/payments';
import css from './paymentsSection.module.scss';

export interface PaymentsSectionProps {
	account: DomainAccount;
}

export const PaymentsSection = observer(({ account }: PaymentsSectionProps) => {
	const accountPlan = useQuery(['payment', 'info', account.address], {
		queryFn: () => MainviewApi.payments.getAccountPlan({ token: domain.session }),
	});

	const transactions = useQuery(['payment', 'transactions', account.address], {
		queryFn: () => MainviewApi.payments.getTransactions({ token: domain.session }),
	});

	return (
		<div className={css.root}>
			{accountPlan.data ? (
				isTrialActive(accountPlan.data) ? (
					<div className={css.details}>
						<div className={css.detailsTitle}>7-day trial period</div>

						<div className={css.trialProgress}>
							<div
								className={css.trialProgressValue}
								style={{
									width: `${
										constrain(
											1 - (accountPlan.data.planEndsAt - Date.now() / 1000) / (60 * 60 * 24 * 7),
											0,
											1,
										) * 100
									}%`,
								}}
							/>
						</div>
					</div>
				) : isPaid(accountPlan.data) ? (
					<>
						<div className={css.details}>
							<div className={css.detailsTitle}>You have an active paid plan</div>

							<div className={css.detailsRow}>
								<div>Active until</div>
								<div>{formatDate(accountPlan.data.planEndsAt * 1000, DateFormatStyle.LONG)}</div>
							</div>

							<div className={css.detailsRow}>
								<div>Plan type</div>
								<div>{accountPlan.data.plan === 'basic' ? 'Basic' : 'Pro'}</div>
							</div>
						</div>
					</>
				) : (
					<ErrorMessage look={ErrorMessageLook.INFO}>No active plan.</ErrorMessage>
				)
			) : accountPlan.isLoading ? (
				<YlideLoader className={css.loader} reason="Loading payment details ..." />
			) : (
				<ErrorMessage>Failed to load payment details 😟</ErrorMessage>
			)}
		</div>
	);
});

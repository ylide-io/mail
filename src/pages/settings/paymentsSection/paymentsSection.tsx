import { observer } from 'mobx-react';
import { useQuery } from 'react-query';

import { FeedManagerApi } from '../../../api/feedManagerApi';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { DomainAccount } from '../../../stores/models/DomainAccount';
import { DateFormatStyle, formatDate } from '../../../utils/date';
import { getActiveCharge, getActiveSubscription } from '../../../utils/payments';
import css from './paymentsSection.module.scss';

export interface PaymentsSectionProps {
	account: DomainAccount;
}

export const PaymentsSection = observer(({ account }: PaymentsSectionProps) => {
	const paymentInfoQuery = useQuery(['payment', 'info', account.account.address], {
		queryFn: () => FeedManagerApi.getPaymentInfo({ token: account.mainViewKey }),
	});

	const activeSubscription = getActiveSubscription(paymentInfoQuery.data);
	const activeCharge = getActiveCharge(paymentInfoQuery.data);

	return (
		<div className={css.root}>
			{paymentInfoQuery.data ? (
				activeSubscription ? (
					<div className={css.details}>
						<div className={css.detailsTitle}>You have active subscription</div>

						<div className={css.detailsRow}>
							<div>Start date</div>
							<div>{formatDate(activeSubscription.created * 1000, DateFormatStyle.LONG)}</div>
						</div>

						<div className={css.detailsRow}>
							<div>Next charge</div>
							<div>{formatDate(activeSubscription.next_charge * 1000, DateFormatStyle.LONG)}</div>
						</div>

						<div className={css.detailsRow}>
							<div>Amount</div>
							<div>
								{activeSubscription.amount} {activeSubscription.token}
							</div>
						</div>
					</div>
				) : activeCharge ? (
					<div className={css.details}>
						<div className={css.detailsTitle}>You have active annual plan</div>

						<div className={css.detailsRow}>
							<div>Start date</div>
							<div>{formatDate(activeCharge.created * 1000, DateFormatStyle.LONG)}</div>
						</div>

						<div className={css.detailsRow}>
							<div>End date</div>
							<div>{formatDate(activeCharge.endOfPeriod * 1000, DateFormatStyle.LONG)}</div>
						</div>

						<div className={css.detailsRow}>
							<div>Amount</div>
							<div>
								{activeCharge.amount} {activeCharge.token}
							</div>
						</div>
					</div>
				) : (
					<ErrorMessage look={ErrorMessageLook.INFO}>No active plan.</ErrorMessage>
				)
			) : paymentInfoQuery.isLoading ? (
				<YlideLoader className={css.loader} reason="Loading payment details ..." />
			) : (
				<ErrorMessage>Failed to load payment details 😟</ErrorMessage>
			)}
		</div>
	);
});

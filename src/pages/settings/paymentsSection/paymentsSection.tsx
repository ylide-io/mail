import { observer } from 'mobx-react';
import { useQuery } from 'react-query';

import { FeedManagerApi } from '../../../api/feedManagerApi';
import { ErrorMessage, ErrorMessageLook } from '../../../components/errorMessage/errorMessage';
import { YlideLoader } from '../../../components/ylideLoader/ylideLoader';
import { DomainAccount } from '../../../stores/models/DomainAccount';
import { DateFormatStyle, formatDate } from '../../../utils/date';
import { getActiveCharges, getActiveSubscriptions } from '../../../utils/payments';
import css from './paymentsSection.module.scss';

export interface PaymentsSectionProps {
	account: DomainAccount;
}

export const PaymentsSection = observer(({ account }: PaymentsSectionProps) => {
	const paymentInfoQuery = useQuery(['payment', 'info', account.account.address], {
		queryFn: () => FeedManagerApi.getPaymentInfo({ token: account.mainViewKey }),
	});

	const activeSubscriptions = getActiveSubscriptions(paymentInfoQuery.data);
	const activeCharges = getActiveCharges(paymentInfoQuery.data);

	return (
		<div className={css.root}>
			{paymentInfoQuery.data ? (
				!activeSubscriptions.length && !activeCharges.length ? (
					<ErrorMessage look={ErrorMessageLook.INFO}>No active plan.</ErrorMessage>
				) : (
					<>
						{activeSubscriptions.map(sub => (
							<div key={sub.id} className={css.details}>
								<div className={css.detailsTitle}>You have active subscription</div>

								<div className={css.detailsRow}>
									<div>Start date</div>
									<div>{formatDate(sub.created * 1000, DateFormatStyle.LONG)}</div>
								</div>

								<div className={css.detailsRow}>
									<div>Next charge</div>
									<div>{formatDate(sub.next_charge * 1000, DateFormatStyle.LONG)}</div>
								</div>

								<div className={css.detailsRow}>
									<div>Amount</div>
									<div>
										{sub.amount} {sub.token}
									</div>
								</div>
							</div>
						))}

						{activeCharges.map(charge => (
							<div key={charge.id} className={css.details}>
								<div className={css.detailsTitle}>You have active annual plan</div>

								<div className={css.detailsRow}>
									<div>Start date</div>
									<div>{formatDate(charge.created * 1000, DateFormatStyle.LONG)}</div>
								</div>

								<div className={css.detailsRow}>
									<div>End date</div>
									<div>{formatDate(charge.endOfPeriod * 1000, DateFormatStyle.LONG)}</div>
								</div>

								<div className={css.detailsRow}>
									<div>Amount</div>
									<div>
										{charge.amount} {charge.token}
									</div>
								</div>
							</div>
						))}
					</>
				)
			) : paymentInfoQuery.isLoading ? (
				<YlideLoader className={css.loader} reason="Loading payment details ..." />
			) : (
				<ErrorMessage>Failed to load payment details 😟</ErrorMessage>
			)}
		</div>
	);
});

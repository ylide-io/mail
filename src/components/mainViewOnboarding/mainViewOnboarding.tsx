import { observer } from 'mobx-react';
import { useEffect } from 'react';

import { FeedManagerApi } from '../../api/feedManagerApi';
import { analytics } from '../../stores/Analytics';
import { browserStorage } from '../../stores/browserStorage';
import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { invariant } from '../../utils/assert';
import { asyncDelay } from '../../utils/asyncDelay';
import { useLatest } from '../../utils/useLatest';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';
import { CoverageModal } from '../coverageModal/coverageModal';
import { LoadingModal } from '../loadingModal/loadingModal';

// <IosInstallPwaPopup />

export interface AuthorizeAccountFlowProps {
	address: string;
	onClose: (account?: DomainAccount) => void;
}

export const AuthorizeAccountFlow = observer(({ address, onClose }: AuthorizeAccountFlowProps) => {
	const onCloseRef = useLatest(onClose);

	useEffect(() => {
		(async () => {
			try {
				const timestamp = Math.floor(Date.now() / 1000);
				analytics.mainviewOnboardingEvent('request-signature');
				let signature;
				try {
					signature = await domain._signMessageAsync({
						message: `Mainview auth for address ${address}, timestamp: ${timestamp}`,
					});
				} catch (e) {
					analytics.mainviewOnboardingEvent('signature-reject');
					throw e;
				}
				const { token } = await FeedManagerApi.authAddress(
					{ address, timestamp, signature },
					browserStorage.referrer,
				);
				if (token) {
					browserStorage.mainViewKeys = {
						...browserStorage.mainViewKeys,
						[address]: token,
					};
					analytics.mainviewOnboardingEvent('account-authorized');
					onCloseRef.current(new DomainAccount(address, token));
				} else {
					onCloseRef.current();
				}
			} catch (e) {
				analytics.mainviewOnboardingEvent('authorization-error');
				onCloseRef.current();
			}
		})();
	}, [address, onCloseRef]);

	return <LoadingModal reason="Authorization ..." />;
});

export interface BuildFeedFlowProps {
	account: DomainAccount;
	onClose: (result: boolean) => void;
}

export const BuildFeedFlow = observer(({ account, onClose }: BuildFeedFlowProps) => {
	const onCloseRef = useLatest(onClose);
	const coverage = domain.feedSettings.coverages.get(account);

	useEffect(() => {
		(async () => {
			try {
				const token = account.mainviewKey;

				console.log('account.mainviewKey: ', account.mainviewKey);
				invariant(token, 'No main view key');

				const res = await FeedManagerApi.init(token, undefined);

				if (res?.inLine) {
					async function checkInit() {
						await asyncDelay(5000);
						const initiated = await FeedManagerApi.checkInit(token);
						if (!initiated) {
							await checkInit();
						}
					}

					await checkInit();
				}

				analytics.mainviewOnboardingEvent('feed-initialized');
			} catch (e) {
				console.error(e);
				analytics.mainviewOnboardingEvent('feed-initialization-error');
				onCloseRef.current(false);
			}
		})();
	}, [account, onCloseRef]);

	return (
		<>
			{!coverage || coverage === 'loading' || coverage === 'error' ? (
				<ActionModal
					title="We're setting up your personalized feed"
					buttons={<ActionButton isLoading size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY} />}
				>
					We're currently fetching data about your tokens and transactions to create a tailored experience
					just for you. This may take a few moments. Thank you for your patience.
				</ActionModal>
			) : (
				<CoverageModal coverage={coverage} onClose={() => onClose(true)} />
			)}
		</>
	);
});

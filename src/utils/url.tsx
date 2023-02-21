import { createSearchParams, useNavigate } from 'react-router-dom';
import { URLSearchParamsInit } from 'react-router-dom/dist/dom';

import AlertModal from '../modals/AlertModal';
import domain from '../stores/Domain';
import { filterObjectEntries } from './object';

export function createCleanSerachParams(search: Record<string, any>) {
	return createSearchParams(filterObjectEntries(search, (key, value) => value != null));
}

//

interface UseNavParameters {
	path?: string;
	search?: URLSearchParamsInit;
}

export const useNav = () => {
	const navigate = useNavigate();

	return (value: string | UseNavParameters) => {
		const params: UseNavParameters = typeof value === 'string' ? { path: value } : value;

		if (params.path && params.path.startsWith('/mail/') && !domain.accounts.activeAccounts.length) {
			AlertModal.show(
				'Please wait',
				'',
				<div style={{ fontSize: 16, marginTop: 20 }}>
					Your transaction is being processed.
					<br />
					<br />
					Once it's done you will be able to use your mailbox.
					<br />
					<br />
					Thank you!
				</div>,
			);
			return;
		}

		navigate({
			pathname: params.path,
			search: params.search ? `?${createSearchParams(params.search).toString()}` : undefined,
		});
	};
};

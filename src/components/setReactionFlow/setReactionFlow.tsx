import { observer } from 'mobx-react';
import { MutableRefObject, ReactNode, useCallback, useRef, useState } from 'react';

import domain from '../../stores/Domain';
import { DomainAccount } from '../../stores/models/DomainAccount';
import { useLatest } from '../../utils/useLatest';
import { ReactionsPopup } from '../reactionsPopup/reactionsPopup';
import { SelectAccountPopup } from '../selectAccountPopup/selectAccountPopup';
import { toast } from '../toast/toast';

enum SetReactionFlowStep {
	NONE,
	SELECT_REACTION,
	SELECT_ACCOUNT,
}

export interface SetReactionFlowProps {
	children: (params: { anchorRef: MutableRefObject<null>; onAnchorClick: () => void }) => ReactNode;
	initialReaction?: string;
	onSelect: (reaction: string, account: DomainAccount) => void;
}

export const SetReactionFlow = observer(({ children, initialReaction, onSelect }: SetReactionFlowProps) => {
	const anchorRef = useRef(null);
	const [step, setStep] = useState(SetReactionFlowStep.NONE);
	const selectedReactionRef = useLatest(initialReaction);
	const selectedAccountRef = useRef<DomainAccount>();
	const onSelectRef = useLatest(onSelect);

	const reset = useCallback(() => {
		setStep(SetReactionFlowStep.NONE);
		selectedReactionRef.current = initialReaction;
		selectedAccountRef.current = undefined;
	}, [initialReaction, selectedReactionRef]);

	const send = useCallback(
		async (reaction: string, account: DomainAccount) => {
			reset();
			onSelectRef.current?.(reaction, account);
		},
		[onSelectRef, reset],
	);

	const proceed = useCallback(() => {
		const accounts = domain.accounts.activeAccounts;

		const account = selectedAccountRef.current;
		const reaction = selectedReactionRef.current;

		if (!accounts.length) {
			toast('Please connect your wallet 👍');
		} else if (!reaction) {
			setStep(SetReactionFlowStep.SELECT_REACTION);
		} else if (!account && accounts.length > 1) {
			setStep(SetReactionFlowStep.SELECT_ACCOUNT);
		} else {
			send(reaction, account || accounts[0]);
		}
	}, [selectedReactionRef, send]);

	const onAnchorClick = useCallback(() => proceed(), [proceed]);

	return (
		<>
			{children({
				anchorRef,
				onAnchorClick,
			})}

			{step === SetReactionFlowStep.SELECT_REACTION && (
				<ReactionsPopup
					anchorRef={anchorRef}
					onSelect={reaction => {
						selectedReactionRef.current = reaction;
						proceed();
					}}
					onClose={() => reset()}
				/>
			)}

			{step === SetReactionFlowStep.SELECT_ACCOUNT && (
				<SelectAccountPopup
					anchorRef={anchorRef}
					accounts={domain.accounts.activeAccounts}
					onSelect={account => {
						selectedAccountRef.current = account;
						proceed();
					}}
					onClose={() => reset()}
				/>
			)}
		</>
	);
});

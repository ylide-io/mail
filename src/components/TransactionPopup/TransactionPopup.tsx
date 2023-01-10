import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';

import { YlideButton } from '../../controls/YlideButton';
import domain from '../../stores/Domain';
import css from './TransactionPopup.module.scss';

const cross = (
	<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect width="20" height="20" rx="10" fill="black" />
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M5.75729 5.75736C5.36676 6.14788 5.36676 6.78105 5.75729 7.17157L8.58572 10L5.75729 12.8284C5.36676 13.219 5.36676 13.8521 5.75729 14.2426C6.14781 14.6332 6.78098 14.6332 7.1715 14.2426L9.99993 11.4142L12.8284 14.2426C13.2189 14.6332 13.852 14.6332 14.2426 14.2426C14.6331 13.8521 14.6331 13.219 14.2426 12.8284L11.4141 10L14.2426 7.17157C14.6331 6.78105 14.6331 6.14788 14.2426 5.75736C13.852 5.36684 13.2189 5.36683 12.8284 5.75736L9.99993 8.58579L7.1715 5.75736C6.78098 5.36684 6.14781 5.36684 5.75729 5.75736Z"
			fill="white"
		/>
	</svg>
);

export const TransactionPopup = observer(() => {
	const s = !!domain.publishingTxHash;
	const [p, sp] = useState(0);

	useEffect(() => {
		const start = Date.now();
		const int = setInterval(() => {
			const passed = Math.min(1, (Date.now() - start) / 120000);
			sp(Math.sqrt(Math.sqrt(passed)) * 100);
			if (passed >= 1) {
				clearInterval(int);
			}
		}, 100);
		return () => {
			clearInterval(int);
		};
	}, []);

	return (
		<div className={css.transactionPopupWrap}>
			{s ? (
				<div
					className={css.cross}
					onClick={() => {
						domain.txPlateVisible = false;
					}}
				>
					{cross}
				</div>
			) : null}
			<div className={clsx(css.transactionPopup, { [css.success]: s })}>
				{s ? (
					<>
						<div className={css.check}>
							<svg
								width="28"
								height="28"
								viewBox="0 0 28 28"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M6 13L12.5 20.5L22.5 5"
									stroke="black"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</div>
						<div className={css.central}>Your tokens has been sent</div>
						<YlideButton
							nice
							onClick={() => {
								if (domain.txChain === 'fantom') {
									window.open(`https://ftmscan.com/tx/${domain.publishingTxHash}`, '_blank');
								} else if (domain.txChain === 'gnosis') {
									window.open(`https://gnosisscan.io/tx/${domain.publishingTxHash}`, '_blank');
								} else if (domain.txChain === 'polygon') {
									window.open(`https://polygonscan.com/tx/${domain.publishingTxHash}`, '_blank');
								}
							}}
						>
							Link to the transaction
						</YlideButton>
					</>
				) : (
					<>
						<div className={css.progress} style={{ width: `${p}%` }}></div>
						<h4 className={css.header}>Your tokens are on the way</h4>
						<div className={css.text}>
							Transaction is in queue. Please, wait 2-3 minutes for it to be mined.
						</div>
						<div className={css.subtext}>Don’t close this page to get notified.</div>
					</>
				)}
			</div>
		</div>
	);
});

import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { GridRowBox, TruncateTextBox } from '../../../../../components/boxes/boxes';
import { DropDown, DropDownItem, DropDownItemMode } from '../../../../../components/dropDown/dropDown';
import { notificationsAlert } from '../../../../../components/genericLayout/header/header';
import { PropsWithClassName } from '../../../../../components/props';
import { Spinner } from '../../../../../components/spinner/spinner';
import { toast } from '../../../../../components/toast/toast';
import { ReactComponent as ArrowDownSvg } from '../../../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ReplySvg } from '../../../../../icons/ic20/reply.svg';
import { BalancesStore } from '../../../../../stores/balancesStore';
import domain from '../../../../../stores/Domain';
import { OutgoingMailData } from '../../../../../stores/outgoingMailData';
import { AlignmentDirection, HorizontalAlignment } from '../../../../../utils/alignment';
import { invariant } from '../../../../../utils/assert';
import { blockchainMeta, evmNameToNetwork } from '../../../../../utils/blockchain';
import { isWalletSupportsBlockchain } from '../../../../../utils/wallet';
import css from './sendMailButton.module.scss';

export interface SendMailButtonProps extends PropsWithClassName {
	mailData: OutgoingMailData;
	allowedChains?: string[];
	disabled?: boolean;
	onSent?: () => void;
}

export const SendMailButton = observer(
	({ className, mailData, allowedChains, disabled, onSent }: SendMailButtonProps) => {
		const menuAnchorRef = useRef(null);
		const [menuVisible, setMenuVisible] = useState(false);
		const currency = useMemo(() => {
			if (mailData.from?.blockchain) {
				try {
					return domain.getBlockchainNativeCurrency(mailData.from.blockchain);
				} catch (err) {}
			} else {
				return '';
			}
		}, [mailData.from]);

		const balances = useMemo(() => {
			const balances = new BalancesStore();

			if (mailData.from?.account) {
				balances.updateBalances(mailData.from.account.wallet, mailData.from.account.account.address);
			}

			return balances;
		}, [mailData.from]);

		const allowedChainsForAccount = useMemo(() => {
			if (allowedChains?.length && mailData.from?.account) {
				return allowedChains.filter(chain => isWalletSupportsBlockchain(mailData.from!.account.wallet, chain));
			}
		}, [allowedChains, mailData.from]);

		useEffect(() => {
			if (mailData.from && allowedChainsForAccount?.length) {
				if (!mailData.from.blockchain || !allowedChainsForAccount.includes(mailData.from.blockchain)) {
					mailData.setFromBlockchain(allowedChainsForAccount[0]);
				}
			}
		}, [allowedChainsForAccount, mailData, mailData.from]);

		const sendMail = async () => {
			try {
				if (await mailData.send()) {
					toast('Your message has been sent successfully 🔥');
					notificationsAlert.remindAboutNotifications();
					onSent?.();
				}
			} catch (e) {
				toast("Couldn't send your message 😒");
			}
		};

		const renderSendText = () => {
			const chainMeta = mailData.from?.blockchain ? blockchainMeta[mailData.from.blockchain] : undefined;

			if (chainMeta) {
				const payment =
					mailData.extraPayment === '0' ? null : (
						<span className={css.extraPayment}>
							({mailData.extraPayment}
							{currency ? ` ${currency}` : ''})
						</span>
					);

				return (
					<>
						Send via {chainMeta.logo()} {chainMeta.title}
						{payment}
					</>
				);
			}

			return 'Send';
		};

		const withDropDown =
			mailData.from?.account?.wallet.factory.blockchainGroup === 'evm' && allowedChainsForAccount?.length !== 1;

		return (
			<div
				className={clsx(css.root, className, {
					[css.root_disabled]: !mailData.readyForSending || disabled,
					[css.root_withDropdown]: withDropDown,
				})}
			>
				<div className={css.text} onClick={sendMail}>
					{mailData.sending ? (
						<>
							<Spinner style={{ marginRight: 6 }} />
							<span className={css.title}>Sending ...</span>
						</>
					) : (
						<>
							<ReplySvg style={{ marginRight: 6 }} />
							<span className={css.title}>{renderSendText()}</span>
						</>
					)}
				</div>

				{withDropDown && (
					<>
						<div
							ref={menuAnchorRef}
							className={css.dropdownIcon}
							onClick={() => setMenuVisible(!menuVisible)}
						>
							<ArrowDownSvg />
						</div>

						{menuVisible && (
							<DropDown
								anchorRef={menuAnchorRef}
								alignmentDirection={AlignmentDirection.TOP}
								horizontalAlign={HorizontalAlignment.END}
								onCloseRequest={() => setMenuVisible(false)}
							>
								{domain.registeredBlockchains
									.filter(f => f.blockchainGroup === 'evm')
									.filter(f => !allowedChains?.length || allowedChains?.includes(f.blockchain))
									.map(({ blockchain }) => {
										const bData = blockchainMeta[blockchain];

										return (
											<DropDownItem
												key={blockchain}
												mode={
													!Number(balances.getBalance(blockchain).toFixed(4))
														? DropDownItemMode.DISABLED
														: undefined
												}
												onSelect={async () => {
													invariant(mailData.from);
													mailData.setFromBlockchain(blockchain);
													setMenuVisible(false);
												}}
											>
												<GridRowBox>
													{bData.logo()}

													<TruncateTextBox>
														{bData.title} [
														{Number(balances.getBalance(blockchain).toFixed(4))}{' '}
														{bData.ethNetwork!.nativeCurrency.symbol}]
													</TruncateTextBox>
												</GridRowBox>
											</DropDownItem>
										);
									})}
							</DropDown>
						)}
					</>
				)}
			</div>
		);
	},
);

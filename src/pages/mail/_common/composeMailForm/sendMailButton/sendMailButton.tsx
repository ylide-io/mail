import { EVM_NAMES } from '@ylide/ethereum';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useMemo, useRef, useState } from 'react';

import { GridRowBox, TruncateTextBox } from '../../../../../components/boxes/boxes';
import { DropDown, DropDownItem, DropDownItemMode } from '../../../../../components/dropDown/dropDown';
import { PropsWithClassName } from '../../../../../components/props';
import { Spinner } from '../../../../../components/spinner/spinner';
import { toast } from '../../../../../components/toast/toast';
import { ReactComponent as ArrowDownSvg } from '../../../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ReplySvg } from '../../../../../icons/ic20/reply.svg';
import domain from '../../../../../stores/Domain';
import { EvmBalances } from '../../../../../stores/evmBalances';
import { OutgoingMailData } from '../../../../../stores/outgoingMailData';
import { AlignmentDirection, HorizontalAlignment } from '../../../../../utils/alignment';
import { invariant } from '../../../../../utils/assert';
import { blockchainMeta, evmNameToNetwork } from '../../../../../utils/blockchain';
import css from './sendMailButton.module.scss';

export interface SendMailButtonProps extends PropsWithClassName {
	mailData: OutgoingMailData;
	disabled?: boolean;
	disableNetworkSwitch?: boolean;
	onSent?: () => void;
}

export const SendMailButton = observer(
	({ className, mailData, disabled, disableNetworkSwitch, onSent }: SendMailButtonProps) => {
		const from = mailData.from;
		const blockchainGroup = from?.wallet.factory.blockchainGroup;

		const menuAnchorRef = useRef(null);
		const [menuVisible, setMenuVisible] = useState(false);
		const currency = useMemo(() => {
			if (mailData.from) {
				try {
					return domain.getBlockchainNativeCurrency(mailData.network);
				} catch (err) {
					return '';
				}
			} else {
				return '';
			}
		}, [mailData.from, mailData.network]);

		const evmBalances = useMemo(() => {
			const balances = new EvmBalances();

			if (from) {
				balances.updateBalances(from.wallet, from.account.address);
			}

			return balances;
		}, [from]);

		const sendMail = async () => {
			try {
				if (await mailData.send()) {
					toast('Your message has been sent successfully 🔥');
					onSent?.();
				}
			} catch (e) {
				toast("Couldn't send your message 😒");
			}
		};

		const renderSendText = () => {
			const payment =
				mailData.extraPayment === '0' ? null : (
					<span className={css.extraPayment}>
						({mailData.extraPayment}
						{currency ? ` ${currency}` : ''})
					</span>
				);
			if (blockchainGroup === 'everscale') {
				const bData = blockchainMeta.everscale;
				return (
					<>
						Send via {bData.logo(14)} {bData.title}
						{payment}
					</>
				);
			} else if (blockchainGroup === 'venom-testnet') {
				const bData = blockchainMeta['venom-testnet'];
				return (
					<>
						Send via {bData.logo(14)} {bData.title}
						{payment}
					</>
				);
			} else if (blockchainGroup === 'evm' && mailData.network != null) {
				const bData = blockchainMeta[EVM_NAMES[mailData.network]];
				if (bData) {
					return (
						<>
							Send via {bData.logo(16)} {bData.title}
							{payment}
						</>
					);
				} else {
					console.log('WTF: ', mailData.network, EVM_NAMES[mailData.network]);
				}
			}

			return 'Send';
		};

		const withDropDown = blockchainGroup === 'evm' && !disableNetworkSwitch;

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
									.map(bc => {
										const bData = blockchainMeta[bc.blockchain];
										const network = evmNameToNetwork(bc.blockchain)!;

										return (
											<DropDownItem
												key={bc.blockchain}
												mode={
													!Number(evmBalances.getBalance(network).toFixed(4))
														? DropDownItemMode.DISABLED
														: undefined
												}
												onSelect={async () => {
													invariant(from);

													await domain.switchEVMChain(from.wallet, network);
													mailData.network = network;

													setMenuVisible(false);
												}}
											>
												<GridRowBox>
													{bData.logo(16)}

													<TruncateTextBox>
														{bData.title} [
														{Number(
															evmBalances
																.getBalance(evmNameToNetwork(bc.blockchain)!)
																.toFixed(4),
														)}{' '}
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

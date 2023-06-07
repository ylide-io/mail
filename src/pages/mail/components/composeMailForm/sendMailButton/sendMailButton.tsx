import { EVM_NAMES } from '@ylide/ethereum';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { ReactNode, useRef, useState } from 'react';

import { DropDown, DropDownItem, DropDownItemMode } from '../../../../../components/dropDown/dropDown';
import { PropsWithClassName } from '../../../../../components/props';
import { Spinner } from '../../../../../components/spinner/spinner';
import { toast } from '../../../../../components/toast/toast';
import { ReactComponent as ArrowDownSvg } from '../../../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ReplySvg } from '../../../../../icons/ic20/reply.svg';
import domain from '../../../../../stores/Domain';
import { evmBalances } from '../../../../../stores/evmBalances';
import { OutgoingMailData } from '../../../../../stores/outgoingMailData';
import { AlignmentDirection, HorizontalAlignment } from '../../../../../utils/alignment';
import { blockchainMeta, evmNameToNetwork } from '../../../../../utils/blockchain';
import css from './sendMailButton.module.scss';

export interface SendMailButtonProps extends PropsWithClassName {
	mailData: OutgoingMailData;
	disabled?: boolean;
	onSent?: () => void;
}

export const SendMailButton = observer(({ className, mailData, disabled, onSent }: SendMailButtonProps) => {
	const blockchainGroup = mailData.from?.wallet.factory.blockchainGroup;

	let text: ReactNode = 'Send';
	if (blockchainGroup === 'everscale') {
		const bData = blockchainMeta.everscale;
		text = (
			<>
				Send via {bData.logo(14)} {bData.title}
			</>
		);
	} else if (blockchainGroup === 'venom-testnet') {
		const bData = blockchainMeta['venom-testnet'];
		text = (
			<>
				Send via {bData.logo(14)} {bData.title}
			</>
		);
	} else if (blockchainGroup === 'evm' && mailData.network !== undefined) {
		const bData = blockchainMeta[EVM_NAMES[mailData.network]];
		if (bData) {
			text = (
				<>
					Send via {bData.logo(16)} {bData.title}
				</>
			);
		} else {
			console.log('WTF: ', mailData.network, EVM_NAMES[mailData.network]);
		}
	}

	const menuAnchorRef = useRef(null);
	const [menuVisible, setMenuVisible] = useState(false);

	const sendMail = async () => {
		try {
			await mailData.send();
			toast('Your message has been sent successfully 🔥');
			onSent?.();
		} catch (e) {
			toast("Couldn't send your message 😒");
		}
	};

	return (
		<div
			className={clsx(css.root, className, {
				[css.root_disabled]: !mailData.readyForSending || disabled,
				[css.root_withDropdown]: blockchainGroup === 'evm',
			})}
		>
			<div className={css.text} onClick={sendMail}>
				{mailData.sending ? (
					<>
						<Spinner style={{ marginRight: 6, color: 'currentcolor' }} />
						<span className={css.title}>Sending ...</span>
					</>
				) : (
					<>
						<ReplySvg style={{ marginRight: 6, fill: 'currentcolor' }} />
						{text && <span className={css.title}>{text}</span>}
					</>
				)}
			</div>

			{blockchainGroup === 'evm' && (
				<>
					<div ref={menuAnchorRef} className={css.dropdownIcon} onClick={() => setMenuVisible(!menuVisible)}>
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
												Number(evmBalances.balances[network].toFixed(3)) === 0
													? DropDownItemMode.DISABLED
													: undefined
											}
											onSelect={async () => {
												const currentBlockchainName =
													await mailData.from!.wallet.controller.getCurrentBlockchain();

												if (currentBlockchainName !== bc.blockchain) {
													await domain.switchEVMChain(mailData.from?.wallet!, network);
													mailData.network = network;
												}

												setMenuVisible(false);
											}}
										>
											{bData.logo(16)}
											{bData.title} [
											{Number(evmBalances.balances[evmNameToNetwork(bc.blockchain)!].toFixed(3))}{' '}
											{bData.ethNetwork!.nativeCurrency.symbol}]
										</DropDownItem>
									);
								})}
						</DropDown>
					)}
				</>
			)}
		</div>
	);
});

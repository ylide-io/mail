import { EVM_NAMES } from '@ylide/ethereum';
import { YMF } from '@ylide/sdk';
import clsx from 'clsx';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import React, { ReactNode, useEffect, useRef, useState } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../../components/ActionButton/ActionButton';
import { ActionModal } from '../../../../../components/actionModal/actionModal';
import { AdaptiveText } from '../../../../../components/adaptiveText/adaptiveText';
import { DropDown, DropDownItem, DropDownItemMode } from '../../../../../components/dropDown/dropDown';
import { PropsWithClassName } from '../../../../../components/props';
import { SelectNetworkModal } from '../../../../../components/selectNetworkModal/selectNetworkModal';
import { Spinner } from '../../../../../components/spinner/spinner';
import { showStaticComponent } from '../../../../../components/staticComponentManager/staticComponentManager';
import { toast } from '../../../../../components/toast/toast';
import { OTC_FEED_ID } from '../../../../../constants';
import { AppMode, REACT_APP__APP_MODE } from '../../../../../env';
import { ReactComponent as ArrowDownSvg } from '../../../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ReplySvg } from '../../../../../icons/ic20/reply.svg';
import domain from '../../../../../stores/Domain';
import { evmBalances } from '../../../../../stores/evmBalances';
import { OutgoingMailData } from '../../../../../stores/outgoingMailData';
import { connectAccount } from '../../../../../utils/account';
import { AlignmentDirection, HorizontalAlignment } from '../../../../../utils/alignment';
import { blockchainMeta, evmNameToNetwork } from '../../../../../utils/blockchain';
import { editorJsToYMF, sendMessage } from '../../../../../utils/mail';
import { truncateInMiddle } from '../../../../../utils/string';
import { getEvmWalletNetwork } from '../../../../../utils/wallet';
import css from './sendMailButton.module.scss';

export interface SendMailButtonProps extends PropsWithClassName {
	mailData: OutgoingMailData;
	onSent?: () => void;
}

export const SendMailButton = observer(({ className, mailData, onSent }: SendMailButtonProps) => {
	useEffect(
		() =>
			autorun(async () => {
				if (mailData.from?.wallet.factory.blockchainGroup === 'evm') {
					mailData.network = await getEvmWalletNetwork(mailData.from.wallet);
					await evmBalances.updateBalances(mailData.from.wallet, mailData.from.account.address);
				}
			}),
		[mailData],
	);

	let text: ReactNode = 'Send';
	if (mailData.from?.wallet.factory.blockchainGroup === 'everscale') {
		const bData = blockchainMeta.everscale;
		text = (
			<>
				Send via {bData.logo(14)} {bData.title}
			</>
		);
	} else if (mailData.from?.wallet.factory.blockchainGroup === 'venom-testnet') {
		const bData = blockchainMeta['venom-testnet'];
		text = (
			<>
				Send via {bData.logo(14)} {bData.title}
			</>
		);
	} else if (mailData.from?.wallet.factory.blockchainGroup === 'evm' && mailData.network !== undefined) {
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

	const sendMailHandler = async () => {
		try {
			if (mailData.to.items.some(r => !r.routing?.details)) {
				return toast("For some of your recipients we didn't find keys on the blockchain.");
			}

			mailData.sending = true;

			const proxyAccount = domain.availableProxyAccounts[0];

			if (!mailData.from) {
				mailData.from = await connectAccount();
				if (!mailData.from) return;

				if (mailData.from.wallet.factory.blockchainGroup === 'evm') {
					const from = mailData.from;

					mailData.network = await showStaticComponent(resolve => (
						<SelectNetworkModal wallet={from.wallet} account={from.account} onClose={resolve} />
					));

					if (!mailData.network) return;
				}
			} else if (proxyAccount && proxyAccount.account.address !== mailData.from.account.address) {
				const proceed = await showStaticComponent<boolean>(resolve => (
					<ActionModal
						title="Different accounts"
						description={
							<>
								You're going to send the message using
								<br />
								<b>
									<AdaptiveText text={mailData.from!.account.address} />
								</b>
								<br />
								But the parent application uses
								<br />
								<b>
									<AdaptiveText text={proxyAccount.account.address} />
								</b>
								<br />
								Are you sure you want to continue sending the message?
							</>
						}
						buttons={[
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.PRIMARY}
								onClick={() => resolve(true)}
							>
								Continue with {truncateInMiddle(mailData.from!.account.address, 8, '...')}
							</ActionButton>,
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.LITE}
								onClick={() => resolve(false)}
							>
								Cancel
							</ActionButton>,
						]}
						onClose={resolve}
					/>
				));

				if (!proceed) return;
			}

			const curr = await mailData.from.wallet.getCurrentAccount();
			if (curr?.address !== mailData.from.account.address) {
				await domain.handleSwitchRequest(mailData.from.wallet.factory.wallet, curr, mailData.from.account);
			}

			let content: YMF;
			if (mailData.hasEditorData) {
				content = editorJsToYMF(mailData.editorData);
			} else {
				content = YMF.fromPlainText(mailData.plainTextData.trim());
			}

			const msgId = await sendMessage(
				mailData.from,
				mailData.subject,
				content,
				mailData.attachments,
				mailData.to.items.map(r => r.routing?.address!),
				mailData.network,
				REACT_APP__APP_MODE === AppMode.OTC ? OTC_FEED_ID : undefined,
			);

			console.log('id: ', msgId);
			toast('Your message has been sent successfully 🔥');
			onSent?.();
		} catch (e) {
			console.log('Error sending message', e);
			toast("Couldn't send your message 😒");
		} finally {
			mailData.sending = false;
		}
	};

	return (
		<div
			className={clsx(css.root, className, {
				[css.root_disabled]:
					mailData.sending ||
					!mailData.from ||
					!mailData.to.items.length ||
					mailData.to.items.some(r => r.isLoading) ||
					(!mailData.hasEditorData && !mailData.hasPlainTextData && !mailData.attachments.length),
				[css.root_withDropdown]: mailData.from?.wallet.factory.blockchainGroup === 'evm',
			})}
		>
			<div className={css.text} onClick={sendMailHandler}>
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

			{mailData.from?.wallet.factory.blockchainGroup === 'evm' && (
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
											<>
												<div style={{ marginRight: 7 }}>{bData.logo(16)}</div>
												{bData.title} [
												{Number(
													evmBalances.balances[evmNameToNetwork(bc.blockchain)!].toFixed(3),
												)}{' '}
												{bData.ethNetwork!.nativeCurrency.symbol}]
											</>
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

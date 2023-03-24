import './sendMailButton.module.scss';

import { EVM_NAMES } from '@ylide/ethereum';
import { Uint256, YMF } from '@ylide/sdk';
import { Dropdown, Menu } from 'antd';
import clsx from 'clsx';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import React, { ReactNode, useEffect } from 'react';

import { useSelectNetworkModal } from '../../../../../components/selectNetworkModal/selectNetworkModal';
import { Spinner } from '../../../../../components/spinner/spinner';
import { useToastManager } from '../../../../../components/toast/toast';
import { REACT_APP__OTC_MODE } from '../../../../../env';
import { ReactComponent as ArrowDownSvg } from '../../../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ReplySvg } from '../../../../../icons/ic20/reply.svg';
import { useSelectWalletModal } from '../../../../../modals/SelectWalletModal';
import domain from '../../../../../stores/Domain';
import { evmBalances } from '../../../../../stores/evmBalances';
import mailer from '../../../../../stores/Mailer';
import { OutgoingMailData } from '../../../../../stores/outgoingMailData';
import { invariant } from '../../../../../utils/assert';
import { blockchainMeta, evmNameToNetwork } from '../../../../../utils/blockchain';
import { editorJsToYMF } from '../../../../../utils/editorjsJson';
import { getEvmWalletNetwork } from '../../../../../utils/wallet';

export interface SendMailButtonProps {
	mailData: OutgoingMailData;
	onSent?: () => void;
}

export const SendMailButton = observer(({ mailData, onSent }: SendMailButtonProps) => {
	const { toast } = useToastManager();
	const selectWalletModal = useSelectWalletModal();
	const selectNetworkModal = useSelectNetworkModal();

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

	const sendMailHandler = async () => {
		try {
			if (mailData.to.items.some(r => !r.routing?.details)) {
				return toast("For some of your recipients we didn't find keys on the blockchain.");
			}

			mailer.sending = true;

			if (!mailData.from) {
				mailData.from = await selectWalletModal({});
				invariant(mailData.from);

				if (mailData.from.wallet.factory.blockchainGroup === 'evm') {
					mailData.network = await selectNetworkModal({
						wallet: mailData.from.wallet,
						account: mailData.from.account,
					});
					invariant(mailData.network);
				}
			}

			const curr = await mailData.from.wallet.getCurrentAccount();
			if (curr?.address !== mailData.from.account.address) {
				await domain.handleSwitchRequest(mailData.from.wallet.factory.wallet, curr, mailData.from.account);
			}

			let content: YMF;
			if (mailData.hasEditorData) {
				const ymfText = editorJsToYMF(mailData.editorData);
				content = YMF.fromYMFText(ymfText);
			} else {
				content = YMF.fromPlainText(mailData.plainTextData!.trim());
			}

			const msgId = await mailer.sendMail(
				mailData.from,
				mailData.subject,
				content,
				mailData.to.items.map(r => r.routing?.address!),
				mailData.network,
				REACT_APP__OTC_MODE
					? ('0000000000000000000000000000000000000000000000000000000000000001' as Uint256)
					: undefined,
			);

			console.log('id: ', msgId);
			toast('Your message has been sent successfully 🔥');
			onSent?.();
		} catch (e) {
			console.log('Error sending message', e);
			toast("Couldn't send your message 😒");
		} finally {
			mailer.sending = false;
		}
	};

	return (
		<div
			className={clsx('send-btn', {
				disabled:
					mailer.sending ||
					!mailData.to.items.length ||
					mailData.to.items.some(r => r.isLoading) ||
					(!mailData.hasEditorData && !mailData.hasPlainTextData),
				withDropdown: mailData.from?.wallet.factory.blockchainGroup === 'evm',
			})}
		>
			<div className="send-btn-text" onClick={sendMailHandler}>
				{mailer.sending ? (
					<>
						<Spinner style={{ marginRight: 6, color: 'currentcolor' }} />
						<span className="send-btn-title">Sending ...</span>
					</>
				) : (
					<>
						<ReplySvg style={{ marginRight: 6, fill: 'currentcolor' }} />
						{text && <span className="send-btn-title">{text}</span>}
					</>
				)}
			</div>

			{mailData.from?.wallet.factory.blockchainGroup === 'evm' && (
				<Dropdown
					overlay={
						<Menu
							onClick={async info => {
								const blockchainName = info.key;
								const newNetwork = evmNameToNetwork(blockchainName);
								const currentBlockchainName =
									await mailData.from!.wallet.controller.getCurrentBlockchain();
								if (currentBlockchainName !== blockchainName) {
									await domain.switchEVMChain(mailData.from?.wallet!, newNetwork!);
									mailData.network = newNetwork;
								}
							}}
							items={domain.registeredBlockchains
								.filter(f => f.blockchainGroup === 'evm')
								.map(bc => {
									const bData = blockchainMeta[bc.blockchain];
									return {
										key: bc.blockchain,
										disabled:
											Number(
												evmBalances.balances[evmNameToNetwork(bc.blockchain)!].toFixed(3),
											) === 0,
										label: (
											<>
												{bData.title} [
												{Number(
													evmBalances.balances[evmNameToNetwork(bc.blockchain)!].toFixed(3),
												)}{' '}
												{bData.ethNetwork!.nativeCurrency.symbol}]
											</>
										),
										icon: <div style={{ marginRight: 7 }}>{bData.logo(16)}</div>,
									};
								})}
						/>
					}
				>
					<div className="send-btn-dropdown-icon">
						<ArrowDownSvg />
					</div>
				</Dropdown>
			)}
		</div>
	);
});

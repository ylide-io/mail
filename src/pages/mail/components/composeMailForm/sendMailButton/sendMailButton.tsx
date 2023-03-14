import './sendMailButton.module.scss';

import { EVM_NAMES } from '@ylide/ethereum';
import { Uint256 } from '@ylide/sdk';
import { Dropdown, Menu } from 'antd';
import clsx from 'clsx';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import React, { ReactNode, useEffect } from 'react';

import { Spinner } from '../../../../../components/spinner/spinner';
import { useToastManager } from '../../../../../components/toast/toast';
import { blockchainsMap, evmNameToNetwork, evmNetworks } from '../../../../../constants';
import { REACT_APP__OTC_MODE } from '../../../../../env';
import { ReactComponent as ArrowDownSvg } from '../../../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ReplySvg } from '../../../../../icons/ic20/reply.svg';
import { useSelectWalletModal } from '../../../../../modals/SelectWalletModal';
import domain from '../../../../../stores/Domain';
import { evmBalances } from '../../../../../stores/evmBalances';
import mailer from '../../../../../stores/Mailer';
import { OutgoingMailData } from '../../../../../stores/outgoingMailData';
import { invariant } from '../../../../../utils/assert';

export interface SendMailButtonProps {
	mailData: OutgoingMailData;
	onSent?: () => void;
}

export const SendMailButton = observer(({ mailData, onSent }: SendMailButtonProps) => {
	const { toast } = useToastManager();
	const selectWalletModal = useSelectWalletModal();

	useEffect(
		() =>
			autorun(async () => {
				if (mailData.from?.wallet.factory.blockchainGroup === 'evm') {
					const blockchainName = await mailData.from.wallet.controller.getCurrentBlockchain();
					mailData.network = evmNameToNetwork(blockchainName);

					await evmBalances.updateBalances(mailData.from.wallet, mailData.from.account.address);
				}
			}),
		[mailData],
	);

	let text: ReactNode = 'Send';
	if (mailData.from?.wallet.factory.blockchainGroup === 'everscale') {
		const bData = blockchainsMap.everscale;
		text = (
			<>
				Send via {bData.logo(14)} {bData.title}
			</>
		);
	} else if (mailData.from?.wallet.factory.blockchainGroup === 'venom-testnet') {
		const bData = blockchainsMap['venom-testnet'];
		text = (
			<>
				Send via {bData.logo(14)} {bData.title}
			</>
		);
	} else if (mailData.from?.wallet.factory.blockchainGroup === 'evm' && mailData.network !== undefined) {
		const bData = blockchainsMap[EVM_NAMES[mailData.network]];
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
				await selectWalletModal({});
				invariant(mailData.from);
			}

			const acc = mailData.from!;
			const curr = await acc.wallet.getCurrentAccount();
			if (curr?.address !== acc.account.address) {
				await domain.handleSwitchRequest(acc.wallet.factory.wallet, curr, acc.account);
			}

			const msgId = await mailer.sendMail(
				acc,
				mailData.subject,
				mailData.hasEditorData ? JSON.stringify(mailData.editorData) : mailData.plainTextData!.trim(),
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
								const newNetwork = evmNetworks.find(n => n.name === blockchainName)?.network;
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
									const bData = blockchainsMap[bc.blockchain];
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

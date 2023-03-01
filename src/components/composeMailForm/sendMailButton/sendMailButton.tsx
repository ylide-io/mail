import './sendMailButton.module.scss';

import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { Dropdown, Menu } from 'antd';
import clsx from 'clsx';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import React, { ReactNode, useEffect } from 'react';

import { blockchainsMap, evmNameToNetwork } from '../../../constants';
import { ReactComponent as ArrowDownSvg } from '../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ReplySvg } from '../../../icons/ic20/reply.svg';
import domain from '../../../stores/Domain';
import { evmBalances } from '../../../stores/evmBalances';
import mailer from '../../../stores/Mailer';
import { OutgoingMailData } from '../../../stores/outgoingMailData';

export interface SendMailButtonProps {
	mailData: OutgoingMailData;
	onSent?: () => void;
}

export const SendMailButton = observer(({ mailData, onSent }: SendMailButtonProps) => {
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
				return alert("For some of your recipients we didn't find keys on the blockchain.");
			}

			mailer.sending = true;

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
			);

			console.log('id: ', msgId);
			onSent?.();
		} catch (e) {
			console.log('Error sending message', e);
			alert("Couldn't send your message.");
		}
	};

	return (
		<div
			className={clsx('send-btn', {
				disabled:
					mailer.sending ||
					!mailData.from ||
					!mailData.to.items.length ||
					mailData.to.items.some(r => r.isLoading) ||
					(!mailData.hasEditorData && !mailData.hasPlainTextData),
				withDropdown: mailData.from?.wallet.factory.blockchainGroup === 'evm',
			})}
		>
			<div className="send-btn-text" onClick={sendMailHandler}>
				<ReplySvg style={{ marginRight: 6, fill: 'currentcolor' }} />
				{text && <span className="send-btn-title">{text}</span>}
			</div>
			{mailData.from?.wallet.factory.blockchainGroup === 'evm' ? (
				<Dropdown
					overlay={
						<Menu
							onClick={async info => {
								const evmNetworks = (Object.keys(EVM_NAMES) as unknown as EVMNetwork[]).map(
									(network: EVMNetwork) => ({
										name: EVM_NAMES[network],
										network: Number(network) as EVMNetwork,
									}),
								);
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
			) : null}
		</div>
	);
});

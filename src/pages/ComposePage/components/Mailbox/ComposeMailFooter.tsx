import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { Dropdown, Menu } from 'antd';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import React, { ReactNode, useEffect } from 'react';
import { generatePath } from 'react-router-dom';

import { RecipientInputItem } from '../../../../components/recipientInput/recipientInput';
import { smallButtonIcons } from '../../../../components/smallButton/smallButton';
import { blockchainsMap, evmNameToNetwork } from '../../../../constants';
import AlertModal from '../../../../modals/AlertModal';
import domain from '../../../../stores/Domain';
import { evmBalances } from '../../../../stores/evmBalances';
import mailer from '../../../../stores/Mailer';
import { useMailStore } from '../../../../stores/MailList';
import { globalOutgoingMailData } from '../../../../stores/outgoingMailData';
import { RoutePath } from '../../../../stores/routePath';
import { useNav } from '../../../../utils/navigate';

interface ComposeMailFooterProps {
	recipients: RecipientInputItem[];
}

const ComposeMailFooter = observer(({ recipients }: ComposeMailFooterProps) => {
	const navigate = useNav();
	const lastActiveFolderId = useMailStore(state => state.lastActiveFolderId);

	useEffect(() => {
		(async () => {
			if (globalOutgoingMailData.from?.wallet.factory.blockchainGroup === 'evm') {
				const blockchainName = await globalOutgoingMailData.from.wallet.controller.getCurrentBlockchain();
				globalOutgoingMailData.network = evmNameToNetwork(blockchainName);

				await evmBalances.updateBalances(
					globalOutgoingMailData.from.wallet,
					globalOutgoingMailData.from.account.address,
				);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [globalOutgoingMailData.from]);

	let text: ReactNode = 'Send';
	if (globalOutgoingMailData.from?.wallet.factory.blockchainGroup === 'everscale') {
		const bData = blockchainsMap.everscale;
		text = (
			<>
				Send via {bData.logo(14)} {bData.title}
			</>
		);
	} else if (
		globalOutgoingMailData.from?.wallet.factory.blockchainGroup === 'evm' &&
		globalOutgoingMailData.network !== undefined
	) {
		const bData = blockchainsMap[EVM_NAMES[globalOutgoingMailData.network]];
		if (bData) {
			text = (
				<>
					Send via {bData.logo(16)} {bData.title}
				</>
			);
		} else {
			console.log('WTF: ', globalOutgoingMailData.network, EVM_NAMES[globalOutgoingMailData.network]);
		}
	}

	const sendMailHandler = async () => {
		try {
			if (recipients.some(r => !r.routing?.details)) {
				return alert("For some of your recipients we didn't find keys on the blockchain.");
			}

			mailer.sending = true;

			const acc = globalOutgoingMailData.from!;
			const curr = await acc.wallet.getCurrentAccount();
			if (curr?.address !== acc.account.address) {
				await domain.handleSwitchRequest(acc.wallet.factory.wallet, curr, acc.account);
			}

			const msgId = await mailer.sendMail(
				acc,
				globalOutgoingMailData.subject,
				JSON.stringify(globalOutgoingMailData.editorData),
				recipients.map(r => r.routing?.address!),
				globalOutgoingMailData.network,
			);

			await AlertModal.show('Message sent', 'Your message was successfully sent');
			console.log('id: ', msgId);

			navigate(generatePath(RoutePath.MAIL_FOLDER, { folderId: lastActiveFolderId }));
		} catch (e) {
			console.log('Error sending message', e);
		}
	};

	return (
		<div className="mail-footer compose-mail-footer">
			<div
				className={clsx('send-btn', {
					disabled:
						mailer.sending ||
						!globalOutgoingMailData.from ||
						!recipients.length ||
						recipients.some(r => r.isLoading) ||
						!globalOutgoingMailData.editorData?.blocks?.length,
					withDropdown: globalOutgoingMailData.from?.wallet.factory.blockchainGroup === 'evm',
				})}
			>
				<div className="send-btn-text" onClick={sendMailHandler}>
					<i style={{ marginRight: 6 }} className={clsx('fa', smallButtonIcons.reply)}></i>
					{text && <span className="send-btn-title">{text}</span>}
				</div>
				{globalOutgoingMailData.from?.wallet.factory.blockchainGroup === 'evm' ? (
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
										await globalOutgoingMailData.from!.wallet.controller.getCurrentBlockchain();
									if (currentBlockchainName !== blockchainName) {
										await domain.switchEVMChain(newNetwork!);
										globalOutgoingMailData.network = newNetwork;
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
														evmBalances.balances[evmNameToNetwork(bc.blockchain)!].toFixed(
															3,
														),
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
							<i className="fa fa-caret-down" />
						</div>
					</Dropdown>
				) : null}
			</div>
		</div>
	);
});

export default ComposeMailFooter;

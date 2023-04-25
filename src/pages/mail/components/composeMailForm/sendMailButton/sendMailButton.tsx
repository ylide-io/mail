import './sendMailButton.module.scss';

import { EVM_NAMES } from '@ylide/ethereum';
import { Uint256, YMF } from '@ylide/sdk';
import { Dropdown, Menu } from 'antd';
import clsx from 'clsx';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import React, { ReactNode, useEffect } from 'react';

import { ActionButtonLook } from '../../../../../components/ActionButton/ActionButton';
import { ActionModal } from '../../../../../components/actionModal/actionModal';
import { AdaptiveText } from '../../../../../components/adaptiveText/adaptiveText';
import { PropsWithClassName } from '../../../../../components/props';
import { SelectNetworkModal } from '../../../../../components/selectNetworkModal/selectNetworkModal';
import { Spinner } from '../../../../../components/spinner/spinner';
import { showStaticComponent } from '../../../../../components/staticComponentManager/staticComponentManager';
import { toast } from '../../../../../components/toast/toast';
import { REACT_APP__OTC_MODE } from '../../../../../env';
import { ReactComponent as ArrowDownSvg } from '../../../../../icons/ic20/arrowDown.svg';
import { ReactComponent as ReplySvg } from '../../../../../icons/ic20/reply.svg';
import domain from '../../../../../stores/Domain';
import { evmBalances } from '../../../../../stores/evmBalances';
import mailer from '../../../../../stores/Mailer';
import { OutgoingMailData } from '../../../../../stores/outgoingMailData';
import { connectAccount } from '../../../../../utils/account';
import { blockchainMeta, evmNameToNetwork } from '../../../../../utils/blockchain';
import { editorJsToYMF } from '../../../../../utils/editorjsJson';
import { truncateInMiddle } from '../../../../../utils/string';
import { getEvmWalletNetwork } from '../../../../../utils/wallet';

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

	const sendMailHandler = async () => {
		try {
			if (mailData.to.items.some(r => !r.routing?.details)) {
				return toast("For some of your recipients we didn't find keys on the blockchain.");
			}

			mailer.sending = true;

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
							{
								title: `Continue with ${truncateInMiddle(mailData.from!.account.address, 8, '...')}`,
								onClick: () => resolve(true),
								look: ActionButtonLook.PRIMARY,
							},
							{
								title: 'Cancel',
								onClick: () => resolve(false),
								look: ActionButtonLook.LITE,
							},
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
				const ymfText = editorJsToYMF(mailData.editorData);
				content = YMF.fromYMFText(ymfText);
			} else {
				content = YMF.fromPlainText(mailData.plainTextData!.trim());
			}

			const msgId = await mailer.sendMail(
				mailData.from,
				mailData.subject,
				content,
				mailData.attachments,
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
			className={clsx(className, 'send-btn', {
				disabled:
					mailer.sending ||
					!mailData.from ||
					!mailData.to.items.length ||
					mailData.to.items.some(r => r.isLoading) ||
					(!mailData.hasEditorData && !mailData.hasPlainTextData && !mailData.attachments.length),
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

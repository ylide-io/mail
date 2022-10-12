import React, { ReactNode, useEffect } from 'react';
import { smallButtonIcons } from '../../../../components/smallButton/smallButton';
import mailer from '../../../../stores/Mailer';
import { observer } from 'mobx-react';
import mailbox from '../../../../stores/Mailbox';
import { useNav } from '../../../../utils/navigate';
import domain from '../../../../stores/Domain';
import AlertModal from '../../../../modals/AlertModal';
import { EVM_NAMES, EVMNetwork } from '@ylide/ethereum';
import { blockchainsMap } from '../../../../constants';
import classNames from 'classnames';
import { Dropdown, Menu } from 'antd';
import mailList from '../../../../stores/MailList';

const Tooltip = observer(() => {
	const navigate = useNav();

	useEffect(() => {
		(async () => {
			if (mailbox.from?.wallet.factory.blockchainGroup === 'evm') {
				const evmNetworks = (Object.keys(EVM_NAMES) as unknown as EVMNetwork[]).map((network: EVMNetwork) => ({
					name: EVM_NAMES[network],
					network: Number(network) as EVMNetwork,
				}));
				const blockchainName = await mailbox.from.wallet.controller.getCurrentBlockchain();
				mailbox.network = evmNetworks.find(n => n.name === blockchainName)?.network;
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mailbox.from]);

	let text: ReactNode = 'Send';
	if (mailbox.from?.wallet.factory.blockchainGroup === 'evm' && mailbox.network !== undefined) {
		const bData = blockchainsMap[EVM_NAMES[mailbox.network]];
		if (bData) {
			text = (
				<>
					Send via {bData.logo(16)} {bData.title}
				</>
			);
		} else {
			console.log('WTF: ', mailbox.network, EVM_NAMES[mailbox.network]);
		}
	}

	const sendMailHandler = async (e: React.MouseEvent) => {
		try {
			e.preventDefault();

			if (!mailbox.textEditorData?.blocks?.length || !mailbox.to.length) return;

			mailer.sending = true;

			//Filter duplicates addresses
			const recipients = mailbox.to
				.filter(v => !!v.address)
				.filter((value, index, array) => array.indexOf(value) === index)
				.map(v => v.address!);
			const recipientKeys = await Promise.all(
				recipients.map(async r => {
					const blockchains = domain.getBlockchainsForAddress(r);
					const keys = await Promise.all(
						blockchains.map(async bc => {
							try {
								return await bc.reader.extractPublicKeyFromAddress(r);
							} catch (err) {
								return null;
							}
						}),
					);
					return keys.some(k => !!k);
				}),
			);

			const recs = recipients.filter((e, i) => recipientKeys[i]);

			if (!recs.length) {
				alert('For your recipients we found no keys on the blockchain');
				mailer.sending = false;
				return;
			}

			const acc = mailbox.from!;
			const curr = await acc.wallet.getCurrentAccount();
			if (curr?.address !== acc.account.address) {
				await domain.handleSwitchRequest(acc.wallet.factory.wallet, curr, acc.account);
			}

			const msgId = await mailer.sendMail(
				acc,
				mailbox.subject,
				JSON.stringify(mailbox.textEditorData),
				recs,
				mailbox.network,
			);

			await AlertModal.show('Message sent', 'Your message was successfully sent');
			console.log('id: ', msgId);

			navigate(`/${mailList.activeFolderId}`);
		} catch (e) {
			console.log('Error sending message', e);
		}
	};

	return (
		<div
			className="mail-body text-right tooltip-demo"
			style={{
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'flex-end',
			}}
		>
			<div
				className={classNames('send-btn', {
					disabled: !mailbox.from || mailer.sending || !mailbox.to.some(r => r.isAchievable),
					withDropdown: mailbox.from?.wallet.factory.blockchainGroup === 'evm',
				})}
			>
				<div className="send-btn-text" onClick={sendMailHandler}>
					<i style={{ marginRight: 6 }} className={classNames('fa', smallButtonIcons.reply)}></i>
					{text && <span>{text}</span>}
				</div>
				{mailbox.from?.wallet.factory.blockchainGroup === 'evm' ? (
					<Dropdown
						overlay={
							<Menu
								onClick={info => {
									const evmNetworks = (Object.keys(EVM_NAMES) as unknown as EVMNetwork[]).map(
										(network: EVMNetwork) => ({
											name: EVM_NAMES[network],
											network: Number(network) as EVMNetwork,
										}),
									);
									const blockchainName = info.key;
									mailbox.network = evmNetworks.find(n => n.name === blockchainName)?.network;
								}}
								items={domain.registeredBlockchains
									.filter(f => f.blockchainGroup === 'evm')
									.map(bc => {
										const bData = blockchainsMap[bc.blockchain];
										return {
											key: bc.blockchain,
											label: bData.title,
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

export default Tooltip;

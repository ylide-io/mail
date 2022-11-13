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
import { createEventFileString } from '../../../../utils/eventFileString';
import { isValidCalendarEventDates } from '../../../../utils/calendarEventDate';

const evmNetworks = (Object.keys(EVM_NAMES) as unknown as EVMNetwork[]).map((network: EVMNetwork) => ({
	name: EVM_NAMES[network],
	network: Number(network) as EVMNetwork,
}));

function evmNameToNetwork(name: string) {
	return evmNetworks.find(n => n.name === name)?.network;
}

const Tooltip = observer(() => {
	const navigate = useNav();

	useEffect(() => {
		(async () => {
			if (mailbox.from?.wallet.factory.blockchainGroup === 'evm') {
				const blockchainName = await mailbox.from.wallet.controller.getCurrentBlockchain();
				mailbox.network = evmNameToNetwork(blockchainName);
				const balances = await mailbox.from.getBalances();
				for (const bcName of Object.keys(balances)) {
					const network = evmNameToNetwork(bcName);
					if (network) {
						mailbox.evmBalances[network] = balances[bcName].number;
					}
				}
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mailbox.from]);

	let text: ReactNode = 'Send';
	if (mailbox.from?.wallet.factory.blockchainGroup === 'everscale') {
		const bData = blockchainsMap.everscale;
		text = (
			<>
				Send via {bData.logo(14)} {bData.title}
			</>
		);
	} else if (mailbox.from?.wallet.factory.blockchainGroup === 'evm' && mailbox.network !== undefined) {
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

			// identifyRouteToAddresses
			const notFoundRecipients: Record<string, boolean> = recipients.reduce(
				(p, c) => ({
					...p,
					[c]: true,
				}),
				{},
			);
			const route = await domain.identifyRouteToAddresses(recipients);
			route.forEach(r => {
				notFoundRecipients[r.recipients[0].keyAddressOriginal] = false;
			});

			const leftNotFound = Object.keys(notFoundRecipients).filter(k => notFoundRecipients[k]);

			if (leftNotFound.length) {
				alert(`For some of your recipients we didn't find keys on the blockchain`);
				mailer.sending = false;
				return;
			}

			const acc = mailbox.from!;
			const curr = await acc.wallet.getCurrentAccount();
			if (curr?.address !== acc.account.address) {
				await domain.handleSwitchRequest(acc.wallet.factory.wallet, curr, acc.account);
			}

			const payload = mailbox.textEditorData;

			if (mailbox.event.active && mailbox.event.startDateTime && mailbox.event.endDateTime) {
				const eventBlockText = createEventFileString({
					organizer: mailbox.from?.account.address || '',
					attendees: mailbox.to.map(toAddress => toAddress.address).filter(i => i) as string[],
					startDateTime: new Date(mailbox.event.startDateTime),
					endDateTime: new Date(mailbox.event.endDateTime),
					summary: mailbox.event.summary || '',
					locaiton: mailbox.event.location || '',
					description: mailbox.event.description || '',
				});

				if (payload.blocks && Array.isArray(payload.blocks)) {
					payload.blocks.push({
						type: "calendarEvent",
						data: {
							text: eventBlockText
						}
					});
				}
			}

			const msgId = await mailer.sendMail(
				acc,
				mailbox.subject,
				JSON.stringify(payload),
				recipients,
				mailbox.network,
			);

			await AlertModal.show('Message sent', 'Your message was successfully sent');
			console.log('id: ', msgId);

			navigate(`/${mailList.activeFolderId || 'inbox'}`);
		} catch (e) {
			console.log('Error sending message', e);
		}
	};

	const validCalendarEvent = !mailbox.event.active || isValidCalendarEventDates(mailbox.event.startDateTime, mailbox.event.endDateTime);

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
					disabled:
						!mailbox.from ||
						mailer.sending ||
						!mailbox.to.some(r => r.isAchievable) ||
						!mailbox.textEditorData?.blocks?.length ||
						!mailbox.to.length ||
						!validCalendarEvent,
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
										await mailbox.from!.wallet.controller.getCurrentBlockchain();
									if (currentBlockchainName !== blockchainName) {
										await domain.switchEVMChain(newNetwork!);
										mailbox.network = newNetwork;
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
													mailbox.evmBalances[evmNameToNetwork(bc.blockchain)!].toFixed(3),
												) === 0,
											label: (
												<>
													{bData.title} [
													{Number(
														mailbox.evmBalances[evmNameToNetwork(bc.blockchain)!].toFixed(
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

export default Tooltip;

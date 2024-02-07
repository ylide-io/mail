import clsx from 'clsx';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import { MainviewApi } from '../../api/mainviewApi';
import { ReactComponent as PlusIcon } from '../../icons/ic20/plus.svg';
import { ReactComponent as TrashIcon } from '../../icons/ic20/trash.svg';
import { FeedSettings } from '../../stores/FeedSettings';
import { truncateAddress } from '../../utils/string';
import { ActionButton, ActionButtonSize } from '../ActionButton/ActionButton';
import { CheckBox } from '../checkBox/checkBox';
import { SimpleSlider } from '../simpleSlider/simpleSlider';
import { AddWalletSourceModal } from './addWalletSourceModal';
import css from './feedSettingsModal.module.scss';

@observer
export class FeedSettingsSidebar extends PureComponent<{
	fs: FeedSettings;
}> {
	handleAddNewWallet = async () => {
		const result = await AddWalletSourceModal.show(this.props.fs);
		if (!result) {
			return;
		}
		const { fs } = this.props;
		const { address, projects } = result;
		if (fs.portfolioSources.find(s => s.id === address)) {
			return;
		}
		runInAction(() => {
			fs.addPortfolioSource(
				{
					id: address,
					type: 'wallet',
				},
				projects,
			);
		});
	};

	renderWallets() {
		const wallets = this.props.fs.portfolioSources.filter(s => s.type === 'wallet');

		return (
			<div className={css.portfolioBlock}>
				<h4>Wallets</h4>
				<div className={css.itemsList}>
					{wallets.map((s, idx) => (
						<div
							key={s.id}
							className={clsx(css.item, {
								[css.first]: idx === 0,
								[css.last]: idx === wallets.length - 1,
							})}
						>
							<span className={css.itemName}>{s.id}</span>
							<a
								href="#delete"
								className={css.itemDelete}
								onClick={e => {
									e.preventDefault();
									e.stopPropagation();

									this.props.fs.removePortfolioSource(s);
								}}
							>
								<TrashIcon />
							</a>
						</div>
					))}
				</div>
				<div className={css.itemsFooter}>
					<ActionButton size={ActionButtonSize.SMALL} icon={<PlusIcon />} onClick={this.handleAddNewWallet}>
						Track new wallet
					</ActionButton>
				</div>
			</div>
		);
	}

	renderCEXAccounts() {
		// const cexAccounts = this.props.fs.portfolioSources.filter(s => s.type === 'external-api');

		return (
			<div className={css.portfolioBlock}>
				<h4>
					CEX accounts{' '}
					<span
						style={{
							padding: '1px 2px',
							background: 'rgba(0, 0, 0, 0.1)',
							borderRadius: 3,
							fontSize: 14,
						}}
					>
						Coming soon
					</span>
				</h4>
				<div className={clsx(css.itemsList, css.disabled)}>
					<ActionButton
						className={css.inlineButton}
						size={ActionButtonSize.SMALL}
						icon={<img src={require('../../assets/exchanges/binance.png')} alt="Exhcnage Logo" />}
					>
						Connect Binance
					</ActionButton>

					<ActionButton
						className={css.inlineButton}
						size={ActionButtonSize.SMALL}
						icon={<img src={require('../../assets/exchanges/coinbase.png')} alt="Exhcnage Logo" />}
					>
						Connect Coinbase
					</ActionButton>

					<ActionButton
						className={css.inlineButton}
						size={ActionButtonSize.SMALL}
						icon={<img src={require('../../assets/exchanges/kraken.png')} alt="Exhcnage Logo" />}
					>
						Connect Kraken
					</ActionButton>

					<ActionButton
						className={css.inlineButton}
						size={ActionButtonSize.SMALL}
						icon={<img src={require('../../assets/exchanges/kucoin.png')} alt="Exhcnage Logo" />}
					>
						Connect KuCoin
					</ActionButton>

					<ActionButton
						className={css.inlineButton}
						size={ActionButtonSize.SMALL}
						icon={<img src={require('../../assets/exchanges/okx.png')} alt="Exhcnage Logo" />}
					>
						Connect OKX
					</ActionButton>
				</div>
			</div>
		);
	}

	renderAccesses() {
		const { accesses, base } = this.props.fs;
		return (
			<div className={css.portfolioBlock}>
				<h4>Accesses to this feed</h4>
				<div className={clsx(css.itemsList)}>
					<div
						className={clsx(css.item, css.first, {
							[css.last]: accesses.length === 0,
						})}
					>
						<span className={css.itemName}>
							{base.owner.name.startsWith('0x') ? truncateAddress(base.owner.name, 24) : base.owner.name}{' '}
							(Owner)
						</span>
					</div>
					{accesses.map((s, idx) => {
						const role =
							s.role === MainviewApi.MVFeedAccessRole.EDIT_USERS
								? 'Admin'
								: s.role === MainviewApi.MVFeedAccessRole.EDIT_SOURCES
								? 'Editor'
								: 'Reader';
						return (
							<div
								key={s.value}
								className={clsx(css.item, {
									[css.last]: idx === accesses.length - 1,
								})}
							>
								<span className={css.itemName}>
									{s.type === 'email' ? s.value : truncateAddress(s.value, 24)} ({role})
								</span>
								<a href="#delete" className={css.itemDelete}>
									<TrashIcon />
								</a>
							</div>
						);
					})}
				</div>
				{/* <div className={css.itemsFooter}>
					<ActionButton size={ActionButtonSize.SMALL} icon={<PlusIcon />}>
						Grant new access
					</ActionButton>
				</div> */}
			</div>
		);
	}

	renderUpdateSettings() {
		return (
			<div className={css.portfolioBlock}>
				<h4>Portfolio tracking settings</h4>
				<div className={css.itemsList}>
					<div className={css.filterLine} style={{ marginBottom: 14 }}>
						<div className={css.filterLabel} style={{ flexGrow: 1, fontSize: 14 }}>
							Feed settings follow portfolio changes
						</div>
						<div className={css.filterValue} style={{ flexGrow: 0, paddingLeft: 10 }}>
							<CheckBox
								isChecked={this.props.fs.mode === MainviewApi.ConfigMode.AUTO_ADD}
								onChange={v => {
									if (v) {
										this.props.fs.mode = MainviewApi.ConfigMode.AUTO_ADD;
									} else {
										this.props.fs.mode = MainviewApi.ConfigMode.DONT_ADD;
									}
								}}
							/>
						</div>
					</div>
					<div className={css.filterLine}>
						<div className={css.filterLabel}>Treshold type:</div>
						<div className={css.filterValue}>
							<select
								className={css.filterSelect}
								value={this.props.fs.tresholdType}
								onChange={e => {
									if (e.target.value === 'value') {
										this.props.fs.tresholdType = 'value';
										this.props.fs.tresholdValue = Math.max(
											0,
											Math.min(
												this.props.fs.portfolio.totalExposure,
												this.props.fs.tresholdValue * this.props.fs.portfolio.totalExposure,
											),
										);
									} else {
										this.props.fs.tresholdType = 'percent';
										this.props.fs.tresholdValue = Math.max(
											0,
											Math.min(
												1,
												this.props.fs.tresholdValue / this.props.fs.portfolio.totalExposure,
											),
										);
									}
								}}
							>
								<option value="value">by absolute USD value</option>
								<option value="percent">by percentage of portfolio</option>
							</select>
						</div>
					</div>
					<div className={css.filterLine}>
						<div className={css.filterLabel}>Threshold:</div>
						<div className={css.filterValue}>
							{this.props.fs.tresholdType === 'value' ? (
								<div className={css.filterValueWrap}>
									$
									<input
										type="number"
										value={this.props.fs.tresholdValue}
										className={css.filterInput}
										onChange={e => {
											//
										}}
									/>
								</div>
							) : (
								<SimpleSlider
									minLabel="0%"
									maxLabel="100%"
									value={this.props.fs.tresholdValue}
									label={v => {
										let lv;
										if (v < 0.25) {
											lv = v / 0.25;
										} else if (v < 0.5) {
											lv = ((v - 0.25) / 0.25) * 9 + 1;
										} else {
											lv = ((v - 0.5) / 0.5) * 90 + 10;
										}
										const vlv = Number(lv.toPrecision(4));
										return `${vlv}%`;
									}}
									onChange={v => (this.props.fs.tresholdValue = Math.floor(v / 0.01) * 0.01)}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	render() {
		const { feed } = this.props.fs.base;

		return (
			<div className={css.sidebar}>
				<div className={css.title}>Settings for "{feed.name}"</div>
				{this.renderWallets()}
				{this.renderCEXAccounts()}
				{this.renderAccesses()}
				{this.renderUpdateSettings()}
			</div>
		);
	}
}

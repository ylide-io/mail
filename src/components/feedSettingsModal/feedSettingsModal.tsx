import clsx from 'clsx';
import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import domain from '../../stores/Domain';
import { FeedSettings } from '../../stores/FeedSettings';
import { Modal } from '../modal/modal';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import css from './feedSettingsModal.module.scss';
import { FeedSettingsSidebar } from './feedSettingsSidebar';
import { FeedSourcesTable } from './feedSettingsSourcesTable';

interface FeedSettingsModalProps {
	feedId: string;
	close: () => void;
}

@observer
export class FeedSettingsModal extends PureComponent<FeedSettingsModalProps> {
	static show(feedId: string) {
		return showStaticComponent(resolve => <FeedSettingsModal close={resolve} feedId={feedId} />);
	}

	@observable fs: FeedSettings;
	@observable searchTerm: string = '';
	@observable saving = false;

	constructor(props: FeedSettingsModalProps) {
		super(props);

		const feedData = domain.feedsRepository.feedDataById.get(props.feedId);
		if (!feedData) {
			throw new Error('Feed not found');
		}
		this.fs = new FeedSettings(feedData, props.feedId);
		makeObservable(this);
	}

	componentDidUpdate(prevProps: FeedSettingsModalProps): void {
		if (prevProps.feedId !== this.props.feedId) {
			const feedData = domain.feedsRepository.feedDataById.get(this.props.feedId);
			if (!feedData) {
				throw new Error('Feed not found');
			}
			this.fs = new FeedSettings(feedData, this.props.feedId);
		}
	}

	handleSave = async () => {
		this.saving = true;
		await this.fs.save();
		this.props.close();
	};

	render() {
		const content = (
			<div className={css.content}>
				<FeedSettingsSidebar fs={this.fs} />
				<div className={css.sources}>
					<div className={css.searchBlock}>
						<input
							type="search"
							className={css.searchInput}
							value={this.searchTerm}
							onChange={e => {
								this.searchTerm = e.target.value;
							}}
							placeholder="Start typing project name..."
						/>
					</div>
					<FeedSourcesTable searchTerm={this.searchTerm} fs={this.fs} />
				</div>
			</div>
		);

		return (
			<Modal
				className={css.root}
				onClose={() => {
					if (this.fs.changed) {
						if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
							this.props.close();
						}
					} else {
						this.props.close();
					}
				}}
			>
				<div className={css.modalContentWrap}>{content}</div>
				<div
					className={clsx(css.modalFooterWrap, this.fs.changed && css.modalFooterWrapVisible)}
					onClick={this.handleSave}
				>
					Save changes
				</div>
			</Modal>
		);
	}
}

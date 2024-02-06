import clsx from 'clsx';
import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { PureComponent } from 'react';

import { LocalFeedSettings } from '../../stores/LocalFeedSettings';
import { Modal } from '../modal/modal';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import { YlideLoader } from '../ylideLoader/ylideLoader';
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

	@observable fs: LocalFeedSettings;
	@observable searchTerm: string = '';

	constructor(props: FeedSettingsModalProps) {
		super(props);

		this.fs = new LocalFeedSettings(this.props.feedId);
		makeObservable(this);
	}

	componentDidUpdate(prevProps: FeedSettingsModalProps): void {
		if (prevProps.feedId !== this.props.feedId) {
			this.fs.destroy();
			this.fs = new LocalFeedSettings(this.props.feedId);
		}
	}

	handleSave = () => {
		//
		this.props.close();
	};

	render() {
		if (this.fs.loading) {
			return (
				<Modal>
					<YlideLoader style={{ marginTop: 30, marginBottom: 30 }} />
				</Modal>
			);
		} else if (this.fs.error) {
			return (
				<Modal>
					<div>
						Error loading rawFeed,{' '}
						<a
							href="#close"
							onClick={e => {
								e.preventDefault();
								e.stopPropagation();
								this.props.close();
							}}
						>
							Close
						</a>
					</div>
				</Modal>
			);
		}

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

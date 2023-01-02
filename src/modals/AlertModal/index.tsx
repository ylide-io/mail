import { observer } from 'mobx-react';
import { PureComponent, ReactNode } from 'react';

import modals from '../../stores/Modals';
import YlideModal from '../YlideModal';

export interface AlertModalProps {
	title?: string;
	subtitle?: string;
	content?: ReactNode;
	onResolve: () => void;
}

@observer
export default class AlertModal extends PureComponent<AlertModalProps> {
	static async show(title?: string, subtitle?: string, content?: ReactNode): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			modals.show((close: () => void) => (
				<AlertModal
					title={title}
					subtitle={subtitle}
					content={content}
					onResolve={() => {
						close();
						resolve();
					}}
				/>
			));
		});
	}

	render() {
		return (
			<YlideModal
				title={this.props.title}
				subtitle={this.props.subtitle}
				cancelContent={null}
				confirmContent={'OK'}
				onConfirm={() => {
					this.props.onResolve();
				}}
			>
				{this.props.content}
			</YlideModal>
		);
	}
}

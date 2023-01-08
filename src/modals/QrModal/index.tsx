import { PureComponent } from 'react';
import { observer } from 'mobx-react';
import { QRCode } from 'react-qrcode-logo';

import modals from '../../stores/Modals';
import YlideModal from '../YlideModal';

export interface QrModalProps {
	title?: string;
	subtitle?: string;
	content?: string;
	onResolve: () => void;
}

@observer
export default class QrModal extends PureComponent<QrModalProps> {
	static async show(content?: string): Promise<void> {
		return new Promise<void>((resolve) => {
			modals.show((close: () => void) => (
				<QrModal
					title={'Share your Ylide!'}
					subtitle={'Your scannable address'}
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
				confirmContent={'Close'}
				onConfirm={() => {
					this.props.onResolve();
				}}
			>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
					<QRCode
						eyeRadius={2}
						logoImage='/favicon-96x96.png'
						logoOpacity={0.8}
						qrStyle='dots'
						value={this.props.content}
					/>
				</div>
			</YlideModal>
		);
	}
}

import { PureComponent } from 'react';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';

import modals from '../../stores/Modals';
import YlideModal from '../YlideModal';

export interface PasswordNewModalProps {
	reason: string;
	onResolve: (value: null | string, remember: boolean) => void;
}

@observer
export default class PasswordNewModal extends PureComponent<PasswordNewModalProps> {
	static async show(reason: string): Promise<{ value: string; remember: boolean } | null> {
		return new Promise<{ value: string; remember: boolean } | null>((resolve, reject) => {
			modals.show((close: () => void) => (
				<PasswordNewModal
					reason={reason}
					onResolve={(val, rem) => {
						close();
						resolve(val ? { value: val, remember: rem } : null);
					}}
				/>
			));
		});
	}

	@observable value: string = '';
	@observable remember = false;

	constructor(props: PasswordNewModalProps) {
		super(props);

		makeObservable(this);
	}

	render() {
		return (
			<YlideModal
				title="Password request"
				subtitle={`Please, enter your Ylide password to ${this.props.reason}`}
				cancelContent="Cancel"
				confirmContent="Confirm"
				onCancel={() => this.props.onResolve(null, false)}
				onConfirm={() => this.props.onResolve(this.value, this.remember)}
			>
				<input
					style={{
						fontFamily: 'Lexend',
						fontSize: 16,
						borderRadius: 40,
						height: 36,
						border: '1px solid #000000',
						padding: '5px 10px',
						marginLeft: 20,
						marginRight: 20,
						marginTop: 20,
						marginBottom: 20,
					}}
					value={this.value}
					onChange={e => (this.value = e.target.value)}
					type="password"
					placeholder="Enter your Ylide password"
				/>
			</YlideModal>
		);
	}
}

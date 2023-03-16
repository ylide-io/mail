import { PureComponent, ReactNode } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../components/ActionButton/ActionButton';

export interface YlideModalProps {
	title?: string;
	subtitle?: string;
	children?: ReactNode | undefined;
	confirmContent?: ReactNode | undefined;
	cancelContent?: ReactNode | undefined;
	onConfirm?: () => void;
	onCancel?: () => void;
}

export default class YlideModal extends PureComponent<YlideModalProps> {
	render() {
		return (
			<div className="modal-wrap">
				<div className="modal-backdrop" />
				<div className="modal-content">
					{this.props.title ? (
						<div
							className="modal-header"
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								border: 0,
							}}
						>
							<h3
								style={{
									fontSize: 24,
									textAlign: 'center',
								}}
							>
								{this.props.title}
							</h3>
						</div>
					) : null}
					{this.props.subtitle ? (
						<div
							className="modal-subtitle"
							style={{
								fontSize: 16,
								textAlign: 'center',
								marginTop: 20,
								marginBottom: 20,
							}}
						>
							{this.props.subtitle}
						</div>
					) : null}
					{this.props.children ? (
						<div
							className="modal-main"
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'stretch',
							}}
						>
							{this.props.children}
						</div>
					) : null}
					<div className="modal-footer" style={{ borderTop: '1px solid #e0e0e0', marginTop: 40 }}>
						{this.props.cancelContent ? (
							<ActionButton size={ActionButtonSize.XLARGE} onClick={this.props.onCancel}>
								{this.props.cancelContent}
							</ActionButton>
						) : null}
						{this.props.confirmContent ? (
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.PRIMARY}
								onClick={this.props.onConfirm}
							>
								{this.props.confirmContent}
							</ActionButton>
						) : null}
					</div>
				</div>
			</div>
		);
	}
}

import React, { ReactNode } from 'react';

import { Modal } from '../modal/modal';
import { showStaticComponent } from '../staticComponentManager/staticComponentManager';
import { YlideLoader } from '../ylideLoader/ylideLoader';

interface LoadingModalProps {
	reason?: ReactNode;
}

export function LoadingModal({ reason }: LoadingModalProps) {
	return (
		<Modal>
			<YlideLoader style={{ padding: 32 }} reason={reason} />
		</Modal>
	);
}

export function showLoadingModal(props?: LoadingModalProps) {
	const closeModalRef = { current: () => {} };

	showStaticComponent(resolve => {
		closeModalRef.current = resolve;
		return <LoadingModal {...props} />;
	});

	return () => closeModalRef.current();
}

import './MailboxEditor.scss';

import React, { useEffect, useMemo } from 'react';
import { createReactEditorJS } from 'react-editor-js';

import { globalOutgoingMailData } from '../../../../../stores/outgoingMailData';
import { EDITOR_JS_TOOLS } from '../../../../../utils/editorJs';

const ReactEditorJS = createReactEditorJS();

const MailboxEditor = () => {
	const instanceRef = React.useRef<any>(null);

	useEffect(() => {
		return () => globalOutgoingMailData.reset();
	}, []);

	const initialEditorData = useMemo(() => globalOutgoingMailData.editorData, []);

	async function handleSave() {
		if (instanceRef.current) {
			globalOutgoingMailData.editorData = await instanceRef.current.save();
		}
	}

	return (
		<div
			style={{
				padding: '25px 15px 0',
				borderTop: '1px solid #e0e0e0',
				flexGrow: 1,
			}}
		>
			<ReactEditorJS
				tools={EDITOR_JS_TOOLS}
				//@ts-ignore
				data={initialEditorData}
				onChange={handleSave}
				instanceRef={(instance: any) => (instanceRef.current = instance)}
				onInitialize={(instance: any) => {
					instanceRef.current = instance;
				}}
			/>
		</div>
	);
};

export default MailboxEditor;

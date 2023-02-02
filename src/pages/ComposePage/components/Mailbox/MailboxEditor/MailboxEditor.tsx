import './MailboxEditor.scss';

import React, { useEffect, useMemo } from 'react';
import { createReactEditorJS } from 'react-editor-js';

import { mailbox } from '../../../../../stores/Mailbox';
import { EDITOR_JS_TOOLS } from '../../../../../utils/editorJs';

const ReactEditorJS = createReactEditorJS();

const MailboxEditor = () => {
	const instanceRef = React.useRef<any>(null);

	useEffect(() => {
		return () => mailbox.resetData();
	}, []);

	const initialEditorData = useMemo(() => mailbox.editorData, []);

	async function handleSave() {
		if (instanceRef.current) {
			mailbox.editorData = await instanceRef.current.save();
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

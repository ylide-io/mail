import './mailboxEditor.scss';

import React, { useRef, useState } from 'react';
import { createReactEditorJS } from 'react-editor-js';

import { OutgoingMailData } from '../../../../stores/outgoingMailData';
import { EDITOR_JS_TOOLS } from '../../../../utils/mail';

const ReactEditorJS = createReactEditorJS();

interface MailboxEditorProps {
	mailData: OutgoingMailData;
}

export function MailboxEditor({ mailData }: MailboxEditorProps) {
	const instanceRef = useRef<any>(null);

	const [initialEditorData] = useState(() => mailData.editorData);

	async function handleSave() {
		if (instanceRef.current) {
			// https://github.com/codex-team/editor.js/issues/2120
			await instanceRef.current.save();

			mailData.editorData = await instanceRef.current.save();
		}
	}

	return (
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
	);
}

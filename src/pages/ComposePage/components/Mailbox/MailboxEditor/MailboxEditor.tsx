import React, { useEffect, useMemo } from 'react';
import { createReactEditorJS } from 'react-editor-js';
import mailbox from '../../../../../stores/Mailbox';
import './MailboxEditor.scss';
import { EDITOR_JS_TOOLS } from '../../../../../utils/editorJs';
import MailboxCalendarEventEditor from '../MailboxCalendarEventEditor/MailboxCalendarEventEditor';

const ReactEditorJS = createReactEditorJS();

const MailboxEditor = () => {
	const instanceRef = React.useRef<any>(null);

	useEffect(() => {
		return () => {
			mailbox.resetData();
		};
	}, []);

	const initialTextData = useMemo(() => {
		return mailbox.textEditorData;
	}, []);

	async function handleSave() {
		if (instanceRef?.current) {
			const savedData = await instanceRef!.current!.save();
			mailbox.textEditorData = savedData;
		}
	}

	return (
		<div className='mailbox-editor'>
			
			<MailboxCalendarEventEditor />
			<div className='mailbox-editor-secion'>
				<ReactEditorJS
					tools={EDITOR_JS_TOOLS}
					//@ts-ignore
					data={initialTextData}
					onChange={handleSave}
					instanceRef={(instance: any) => (instanceRef.current = instance)}
					onInitialize={(instance: any) => {
						instanceRef.current = instance;
					}}
				/>
			</div>
		</div>
	);
};

export default MailboxEditor;

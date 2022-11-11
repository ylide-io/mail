import React, { useEffect, useMemo } from 'react';
import { createReactEditorJS } from 'react-editor-js';
import mailbox from '../../../../../stores/Mailbox';
import './MailboxEditor.scss';
import { EDITOR_JS_TOOLS } from '../../../../../utils/editorJs';

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
		<>
			<div
				style={{
					padding: '25px 15px 0',
					border: '1px solid #e0e0e0',
				}}
			>
				<div className="form-group row">
					<label className="col-sm-1 col-form-label">Summary:</label>
					<div className="col-sm-11">
						<input
							type="text"
							className="form-control"
							value={mailbox.event.summary}
							onChange={e => (mailbox.event.summary = e.target.value)}
						/>
					</div>
				</div>
				<div className="form-group row">
					<label className="col-sm-1 col-form-label">Location:</label>
					<div className="col-sm-11">
						<input
							type="text"
							className="form-control"
							value={mailbox.event.location}
							onChange={e => (mailbox.event.location = e.target.value)}
						/>
					</div>
				</div>
				<div className="form-group row">
					<label className="col-sm-1 col-form-label">Start:</label>
					<div className="col-sm-11">
						<input
							type="datetime-local"
							className="form-control"
							value={mailbox.event.startDateTime}
							onChange={e => (mailbox.event.startDateTime = e.target.value)}
						/>
					</div>
				</div>
				<div className="form-group row">
					<label className="col-sm-1 col-form-label">End:</label>
					<div className="col-sm-11">
						<input
							type="datetime-local"
							className="form-control"
							value={mailbox.event.endDateTime}
							onChange={e => (mailbox.event.endDateTime = e.target.value)}
						/>
					</div>
				</div>
				<div className="form-group row">
					<label className="col-sm-1 col-form-label">Description:</label>
					<div className="col-sm-11">
						<textarea
							className="form-control"
							value={mailbox.event.description}
							onChange={e => (mailbox.event.description = e.target.value)}
						/>
					</div>
				</div>
			</div>
			<div
				style={{
					padding: '25px 15px 0',
					border: '1px solid #e0e0e0',
				}}
			>
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
		</>
	);
};

export default MailboxEditor;

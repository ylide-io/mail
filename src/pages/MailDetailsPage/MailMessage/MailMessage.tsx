import { Tooltip } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { createReactEditorJS } from 'react-editor-js';

import { ActionButton, ActionButtonStyle } from '../../../components/ActionButton/ActionButton';
import { ContactName } from '../../../components/contactName/contactName';
import { ReadableDate } from '../../../components/readableDate/readableDate';
import { Blockie } from '../../../controls/Blockie';
import { ForwardIcon } from '../../../icons/ForwardIcon';
import { ReplyIcon } from '../../../icons/ReplyIcon';
import { TrashIcon } from '../../../icons/TrashIcon';
import { IMessageDecodedContent } from '../../../indexedDB/MessagesDB';
import { FolderId, ILinkedMessage, useMailStore } from '../../../stores/MailList';
import { DateFormatStyle } from '../../../utils/date';
import { decodeEditorData, EDITOR_JS_TOOLS } from '../../../utils/editorJs';
import css from './MailMessage.module.scss';

const ReactEditorJS = createReactEditorJS();

export interface MailMessageProps {
	message: ILinkedMessage;
	decoded?: IMessageDecodedContent;
	folderId?: FolderId;
	onReady?: () => void;
	onReplyClick: () => void;
	onForwardClick: () => void;
	onDeleteClick: () => void;
}

export function MailMessage({
	message,
	decoded,
	folderId,
	onReady,
	onReplyClick,
	onForwardClick,
	onDeleteClick,
}: MailMessageProps) {
	const decodeMessage = useMailStore(state => state.decodeMessage);

	const editorData = useMemo(() => decodeEditorData(decoded?.decodedTextData), [decoded?.decodedTextData]);

	const onDecodeClick = () => {
		decodeMessage(message);
	};

	const [isEditorReady, setEditorReady] = useState(!editorData.blocks);
	useEffect(() => {
		if (isEditorReady) {
			onReady?.();
		}
	}, [isEditorReady, onReady]);

	return (
		<div className={css.root}>
			<Blockie className={css.avatar} address={message.msg.senderAddress} />

			<div className={css.title}>{decoded ? decoded.decodedSubject || '(no subject)' : '[Encrypted]'}</div>

			<div className={css.actions}>
				{decoded ? (
					<>
						<ActionButton icon={<ReplyIcon />} onClick={() => onReplyClick()}>
							Reply
						</ActionButton>

						<Tooltip title="Forward">
							<ActionButton icon={<ForwardIcon />} onClick={() => onForwardClick()} />
						</Tooltip>

						{folderId !== FolderId.Archive && (
							<Tooltip title="Archive">
								<ActionButton
									style={ActionButtonStyle.Dengerous}
									icon={<TrashIcon />}
									onClick={() => onDeleteClick()}
								/>
							</Tooltip>
						)}
					</>
				) : (
					<ActionButton onClick={() => onDecodeClick()}>Decode message</ActionButton>
				)}
			</div>

			<div className={css.sender}>
				<div className={css.senderLabel}>Sender:</div>
				<ContactName address={message.msg.senderAddress} />
			</div>

			<ReadableDate className={css.date} style={DateFormatStyle.LONG} value={message.msg.createdAt * 1000} />

			{editorData.blocks && (
				<div className={css.body}>
					<ReactEditorJS
						tools={EDITOR_JS_TOOLS}
						readOnly={true}
						//@ts-ignore
						data={editorData}
						onReady={() => setEditorReady(true)}
					/>
				</div>
			)}
		</div>
	);
}

import { Tooltip } from 'antd';
import { toJS } from 'mobx';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { createReactEditorJS } from 'react-editor-js';

import { ActionButton, ActionButtonStyle } from '../../../components/ActionButton/ActionButton';
import { ContactName } from '../../../components/contactName/contactName';
import { Blockie } from '../../../controls/Blockie';
import { ForwardIcon } from '../../../icons/ForwardIcon';
import { ReplyIcon } from '../../../icons/ReplyIcon';
import { TrashIcon } from '../../../icons/TrashIcon';
import { IMessageDecodedContent } from '../../../indexedDB/MessagesDB';
import { FolderId, ILinkedMessage, useMailStore } from '../../../stores/MailList';
import { EDITOR_JS_TOOLS } from '../../../utils/editorJs';
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
	console.log('folderId', folderId, folderId === FolderId.Archive);
	const data = useMemo(
		() => ({
			blocks:
				typeof decoded?.decodedTextData === 'string'
					? JSON.parse(decoded.decodedTextData).blocks
					: toJS(decoded?.decodedTextData?.blocks),
		}),
		[decoded?.decodedTextData],
	);

	const onDecodeClick = () => {
		decodeMessage(message);
	};

	const [isEditorReady, setEditorReady] = useState(!data.blocks);
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

			<div className={css.date}>{moment.unix(message.msg.createdAt).format('HH:mm DD.MM.YYYY')}</div>

			{data.blocks && (
				<div className={css.body}>
					<ReactEditorJS
						tools={EDITOR_JS_TOOLS}
						readOnly={true}
						//@ts-ignore
						data={data}
						onReady={() => setEditorReady(true)}
					/>
				</div>
			)}
		</div>
	);
}

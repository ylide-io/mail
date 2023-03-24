import { YMF } from '@ylide/sdk';
import { Tooltip } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { createReactEditorJS } from 'react-editor-js';

import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { Blockie } from '../../../../components/blockie/blockie';
import { ContactName } from '../../../../components/contactName/contactName';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { ReactComponent as ForwardSvg } from '../../../../icons/ic20/forward.svg';
import { ReactComponent as ReplySvg } from '../../../../icons/ic20/reply.svg';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { IMessageDecodedSerializedContent } from '../../../../indexedDB/MessagesDB';
import { FolderId, ILinkedMessage, useMailStore } from '../../../../stores/MailList';
import { DateFormatStyle } from '../../../../utils/date';
import { decodeEditorData, EDITOR_JS_TOOLS } from '../../../../utils/editorJs';
import { ymfToEditorJs } from '../../../../utils/editorjsJson';
import { formatSubject } from '../../../../utils/mail';
import css from './mailMessage.module.scss';

const ReactEditorJS = createReactEditorJS();

export interface MailMessageProps {
	message: ILinkedMessage;
	decoded?: IMessageDecodedSerializedContent;
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

	const editorData = useMemo(() => {
		if (!decoded?.decodedTextData) return null;
		if (decoded.decodedTextData.type === 'plain') {
			const json = decodeEditorData(decoded.decodedTextData.value);
			const isQamonMessage = !json?.blocks;
			return isQamonMessage
				? {
						time: 1676587472156,
						blocks: [{ id: '2cC8_Z_Rad', type: 'paragraph', data: { text: (json as any).body } }],
						version: '2.26.5',
				  }
				: json;
		} else {
			return ymfToEditorJs(YMF.fromYMFText(decoded.decodedTextData.value));
		}
	}, [decoded?.decodedTextData]);

	const onDecodeClick = () => {
		decodeMessage(message);
	};

	const [isEditorReady, setEditorReady] = useState(!editorData);
	useEffect(() => {
		if (isEditorReady) {
			onReady?.();
		}
	}, [isEditorReady, onReady]);

	return (
		<div className={css.root}>
			<Blockie className={css.avatar} address={message.msg.senderAddress} />

			<div className={css.title}>{decoded ? formatSubject(decoded.decodedSubject) : '[Encrypted]'}</div>

			<div className={css.actions}>
				{decoded ? (
					<>
						<ActionButton icon={<ReplySvg />} onClick={() => onReplyClick()}>
							Reply
						</ActionButton>

						<Tooltip title="Forward">
							<ActionButton icon={<ForwardSvg />} onClick={() => onForwardClick()} />
						</Tooltip>

						{folderId !== FolderId.Archive && (
							<Tooltip title="Archive">
								<ActionButton
									look={ActionButtonLook.DANGEROUS}
									icon={<TrashSvg />}
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

			{editorData?.blocks && (
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

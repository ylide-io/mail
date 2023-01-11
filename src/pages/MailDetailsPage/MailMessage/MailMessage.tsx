import { Tooltip } from 'antd';
import { toJS } from 'mobx';
import moment from 'moment';
import React, { useMemo } from 'react';
import { createReactEditorJS } from 'react-editor-js';

import { ActionButton, ActionButtonStyle } from '../../../components/ActionButton/ActionButton';
import { AdaptiveAddress } from '../../../controls/AdaptiveAddress';
import { Blockie } from '../../../controls/Blockie';
import { ForwardIcon } from '../../../icons/ForwardIcon';
import { ReplyIcon } from '../../../icons/ReplyIcon';
import { TrashIcon } from '../../../icons/TrashIcon';
import { IMessageDecodedContent } from '../../../indexedDB/MessagesDB';
import { ILinkedMessage } from '../../../stores/MailList';
import { EDITOR_JS_TOOLS } from '../../../utils/editorJs';
import css from './MailMessage.module.scss';

const ReactEditorJS = createReactEditorJS();

export interface MailMessageProps {
	message: ILinkedMessage;
	decoded: IMessageDecodedContent;
	onReplyClick: () => void;
	onForwardClick: () => void;
	onDeleteClick: () => void;
}

export function MailMessage({ message, decoded, onReplyClick, onForwardClick, onDeleteClick }: MailMessageProps) {
	const data = useMemo(
		() => ({
			blocks:
				typeof decoded.decodedTextData === 'string'
					? JSON.parse(decoded.decodedTextData).blocks
					: toJS(decoded.decodedTextData?.blocks),
		}),
		[decoded.decodedTextData],
	);

	return (
		<div className={css.root}>
			<Blockie className={css.avatar} address={message.msg.senderAddress} />

			<div className={css.title}>{decoded.decodedSubject || 'View Message'}</div>

			<div className={css.actions}>
				<ActionButton icon={<ReplyIcon />} onClick={() => onReplyClick()}>
					Reply
				</ActionButton>

				<Tooltip title="Forward">
					<ActionButton icon={<ForwardIcon />} onClick={() => onForwardClick()} />
				</Tooltip>

				<Tooltip title="Archive">
					<ActionButton
						style={ActionButtonStyle.Dengerous}
						icon={<TrashIcon />}
						onClick={() => onDeleteClick()}
					/>
				</Tooltip>
			</div>

			<div className={css.sender}>
				<div className={css.senderLabel}>Sender:</div>
				<AdaptiveAddress address={message.msg.senderAddress} />
			</div>

			<div className={css.date}>{moment.unix(message.msg.createdAt).format('HH:mm DD.MM.YYYY')}</div>

			<div className={css.body}>
				{data.blocks && (
					<ReactEditorJS
						tools={EDITOR_JS_TOOLS}
						readOnly={true}
						//@ts-ignore
						data={data}
					/>
				)}
			</div>
		</div>
	);
}

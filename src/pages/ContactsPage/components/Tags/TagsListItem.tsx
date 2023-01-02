import { DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import React, { useState } from 'react';

import { ActionButton, ActionButtonStyle } from '../../../../components/ActionButton/ActionButton';
import { ITag } from '../../../../stores/models/ITag';
import tags from '../../../../stores/Tags';
import { allColors } from '../../../../utils/colors';
import ColorPicker from './ColorPicker';

interface TagsListItemProps {
	tag: ITag;
	isNew?: boolean;
}

export interface IColor {
	value: number;
	name: string;
}

const TagsListItem: React.FC<TagsListItemProps> = ({ tag, isNew }) => {
	const [editing, setEditing] = useState(isNew || false);
	const [name, setName] = useState(tag.name);
	const [color, setColor] = useState<string>(tag.color);

	const editClickHandler = () => {
		setEditing(true);
	};

	const saveClickHandler = () => {
		const newTag: ITag = {
			id: tag.id,
			name,
			color,
			icon: '',
		};
		if (isNew) {
			tags.resetNewTag();
			tags.saveTag(newTag);
		} else {
			tags.updateTag(newTag);
		}
		setEditing(false);
	};

	const deleteClickHandler = async () => {
		await tags.deleteTag(tag.id);
	};

	if (editing) {
		return (
			<div className="contacts-list-item">
				<div className="contact-folders">
					<div style={{ display: 'inline-flex' }}>
						{allColors.map(c => (
							<ColorPicker key={c} onClick={setColor} active={c === color} color={c} />
						))}
					</div>
				</div>
				<div className="contact-name">
					<Input
						type="text"
						placeholder="Type new folder name"
						value={name}
						style={{ width: '100%' }}
						onChange={e => setName(e.target.value)}
					/>
				</div>
				<div className="contact-actions small-actions">
					{!isNew ? (
						<>
							<ActionButton
								style={ActionButtonStyle.Primary}
								onClick={saveClickHandler}
								icon={<SaveOutlined />}
							/>
							<ActionButton
								style={ActionButtonStyle.Dengerous}
								onClick={deleteClickHandler}
								icon={<DeleteOutlined />}
							/>
						</>
					) : (
						<ActionButton
							style={ActionButtonStyle.Primary}
							onClick={saveClickHandler}
							icon={<SaveOutlined />}
						/>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="contacts-list-item">
			<div className="contact-folders">
				<div style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: tag.color }} />
			</div>
			<div className="contact-name">{tag.name}</div>
			<div className="contact-actions small-actions">
				<ActionButton onClick={editClickHandler} icon={<EditOutlined />} />
			</div>
		</div>
	);
};

export default TagsListItem;

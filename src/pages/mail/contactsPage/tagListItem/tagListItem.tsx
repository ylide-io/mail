import React, { useState } from 'react';

import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { TextField } from '../../../../components/textField/textField';
import { ReactComponent as EditSvg } from '../../../../icons/ic20/edit.svg';
import { ReactComponent as TickSvg } from '../../../../icons/ic20/tick.svg';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { ITag } from '../../../../stores/models/ITag';
import tags from '../../../../stores/Tags';
import { allColors } from '../../../../utils/colors';
import ColorPicker from '../colorPicker/colorPicker';

interface TagListItemProps {
	tag: ITag;
	isNew?: boolean;
}

const TagListItem = ({ tag, isNew }: TagListItemProps) => {
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
					<TextField placeholder="Tag name" value={name} onValueChange={setName} />
				</div>
				<div className="contact-actions small-actions">
					{!isNew ? (
						<>
							<ActionButton
								look={ActionButtonLook.PRIMARY}
								onClick={saveClickHandler}
								icon={<TickSvg />}
							/>
							<ActionButton
								look={ActionButtonLook.DANGEROUS}
								onClick={deleteClickHandler}
								icon={<TrashSvg />}
							/>
						</>
					) : (
						<ActionButton look={ActionButtonLook.PRIMARY} onClick={saveClickHandler} icon={<TickSvg />} />
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
				<ActionButton onClick={editClickHandler} icon={<EditSvg />} />
			</div>
		</div>
	);
};

export default TagListItem;

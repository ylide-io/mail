import clsx from 'clsx';
import { useState } from 'react';

import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { TextField } from '../../../../components/textField/textField';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as EditSvg } from '../../../../icons/ic20/edit.svg';
import { ReactComponent as TickSvg } from '../../../../icons/ic20/tick.svg';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { ITag } from '../../../../indexedDB/IndexedDB';
import tags from '../../../../stores/Tags';
import { allColors } from '../../../../utils/colors';
import css from './tagListItem.module.scss';

interface TagListItemProps {
	tag: ITag;
	isNew?: boolean;
}

const TagListItem = ({ tag, isNew }: TagListItemProps) => {
	const [isEditing, setEditing] = useState(isNew || false);
	const [name, setName] = useState(tag.name);
	const [color, setColor] = useState<string>(tag.color);

	const editClickHandler = () => {
		setEditing(true);
	};

	const saveClickHandler = () => {
		const cleanName = name.trim();
		if (!cleanName) {
			return toast('Please enter tag name');
		}

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

	return (
		<div className={css.root}>
			{isEditing ? (
				<>
					<div className={css.colors}>
						{allColors.map(c => (
							<div
								onClick={() => setColor(c)}
								className={clsx(css.color, c !== color && css.color_notSelected)}
								style={{ backgroundColor: c }}
							/>
						))}
					</div>
					<div className={css.name}>
						<TextField placeholder="Tag name" value={name} onValueChange={setName} />
					</div>
					<div className={css.actions}>
						<ActionButton look={ActionButtonLook.PRIMARY} onClick={saveClickHandler} icon={<TickSvg />} />
						{isNew || (
							<ActionButton
								look={ActionButtonLook.DANGEROUS}
								onClick={deleteClickHandler}
								icon={<TrashSvg />}
							/>
						)}
					</div>
				</>
			) : (
				<>
					<div className={css.color} style={{ backgroundColor: tag.color }} />
					<div className={css.name}>{tag.name}</div>
					<div className={css.actions}>
						<ActionButton onClick={editClickHandler} icon={<EditSvg />}>
							Edit
						</ActionButton>
					</div>
				</>
			)}
		</div>
	);
};

export default TagListItem;

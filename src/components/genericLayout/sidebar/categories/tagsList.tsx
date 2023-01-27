import { observer } from 'mobx-react';
import React, { useEffect } from 'react';

import { FolderId } from '../../../../stores/MailList';
import tags from '../../../../stores/Tags';
import TagsEmpty from '../tagsEmpty';
import Tag from './tag';

interface TagsListProps {
	folderId: FolderId;
}

const TagsList = observer(({ folderId }: TagsListProps) => {
	useEffect(() => {
		tags.getTags();
	}, []);

	return (
		<div className="tag-list">
			{tags.tags.length ? (
				tags.tags.map(elem => (
					<Tag
						key={elem.id}
						isActive={folderId === String(elem.id)}
						tagId={elem.id}
						circleColor={elem.color}
						text={elem.name}
						icon={elem.icon}
					/>
				))
			) : (
				<TagsEmpty />
			)}
		</div>
	);
});

export default TagsList;

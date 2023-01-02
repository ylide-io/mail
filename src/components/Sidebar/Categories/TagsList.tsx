import { observer } from 'mobx-react';
import React, { useEffect } from 'react';

import mailList from '../../../stores/MailList';
import tags from '../../../stores/Tags';
import TagsEmpty from '../TagsEmpty';
import Tag from './Tag';

const TagsList = observer(() => {
	useEffect(() => {
		tags.getTags();
	}, []);

	return (
		<div className="tag-list">
			{tags.tags.length ? (
				tags.tags.map(elem => (
					<Tag
						key={elem.id}
						isActive={mailList.activeFolderId === String(elem.id)}
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

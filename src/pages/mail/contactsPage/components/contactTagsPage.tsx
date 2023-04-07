import { observer } from 'mobx-react';
import React, { useEffect } from 'react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { ReactComponent as PlusSvg } from '../../../../icons/ic20/plus.svg';
import tags from '../../../../stores/Tags';
import { ContactsLayout, ContactsTab } from '../contactsLayout/contactsLayout';
import TagsEmpty from './tagsEmpty';
import TagsListItem from './tagsListItem';

export const ContactTagsPage = observer(() => {
	useEffect(() => {
		tags.retrieveTags();
	}, []);

	return (
		<ContactsLayout
			activeTab={ContactsTab.TAGS}
			title="Tags"
			titleRight={
				<ActionButton
					size={ActionButtonSize.MEDIUM}
					look={ActionButtonLook.PRIMARY}
					icon={<PlusSvg style={{ display: 'inline-block', verticalAlign: 'middle' }} />}
					onClick={() => tags.generateNewTag()}
				>
					New tag
				</ActionButton>
			}
		>
			{!tags.tags.length && !tags.newTag ? (
				<TagsEmpty />
			) : (
				<div className="contacts-list">
					{tags.newTag && <TagsListItem isNew={true} tag={{ ...tags.newTag }} />}
					{tags.tags.map(tag => (
						<TagsListItem key={tag.id} tag={{ ...tag }} />
					))}
				</div>
			)}
		</ContactsLayout>
	);
});

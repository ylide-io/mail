import { observer } from 'mobx-react';

import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../components/ActionButtonX/ActionButton';
import { ReactComponent as PlusSvg } from '../../../icons/ic20/plus.svg';
import tags from '../../../stores/Tags';
import { ContactsLayout, ContactsTab } from './contactsLayout/contactsLayout';
import TagListItem from './tagListItem/tagListItem';

export const ContactTagsPage = observer(() => {
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
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						flexDirection: 'column',
						alignItems: 'center',
						padding: '100px 20px 150px',
					}}
				>
					<h3>Your tag list is empty yet.</h3>
				</div>
			) : (
				<div>
					{tags.newTag && <TagListItem isNew={true} tag={{ ...tags.newTag }} />}
					{tags.tags.map(tag => (
						<TagListItem key={tag.id} tag={{ ...tag }} />
					))}
				</div>
			)}
		</ContactsLayout>
	);
});

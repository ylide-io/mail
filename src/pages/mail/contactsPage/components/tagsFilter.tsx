import { observer } from 'mobx-react';

import { DropDownItem, DropDownItemMode } from '../../../../components/dropDown/dropDown';
import { Select } from '../../../../components/select/select';
import contacts from '../../../../stores/Contacts';
import tags from '../../../../stores/Tags';

export const TagsFilter = observer(() => {
	return (
		<Select placeholder="Filter by folder">
			{onSelect => (
				<>
					<DropDownItem
						mode={!contacts.filterByTag ? DropDownItemMode.SELECTED : undefined}
						onSelect={() => {
							onSelect();
							contacts.setFilterByTag(null);
						}}
					>
						All folders
					</DropDownItem>

					{tags.tags.map(tag => (
						<DropDownItem
							mode={contacts.filterByTag?.id === tag.id ? DropDownItemMode.SELECTED : undefined}
							onSelect={() => {
								onSelect();
								contacts.setFilterByTag(tag);
							}}
						>
							{tag.name}
						</DropDownItem>
					))}
				</>
			)}
		</Select>
	);
});

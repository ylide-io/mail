import tags from '../../../stores/Tags';
import contacts from '../../../stores/Contacts';
import { Select } from 'antd';
import { observer } from 'mobx-react';

const TagsFilter = observer(() => {
	const options = tags.tags.map(tag => ({ value: tag.id, label: tag.name }));

	const selectHandler = (option: number) => {
		if (option) {
			const tag = tags.tags.find(tag => tag.id === option);
			if (tag) {
				contacts.setFilterByTag(tag);
				return;
			}
		}
		contacts.setFilterByTag(null);
	};

	return (
		<Select
			placeholder={'Filter by folder'}
			options={[{ value: 0, label: 'All folders' }, ...options]}
			value={contacts.filterByTag ? contacts.filterByTag.id : 0}
			onChange={selectHandler}
		/>
	);
});

export default TagsFilter;

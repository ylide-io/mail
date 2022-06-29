import React from "react";
import Select, { SingleValue } from "react-select";
import { ITag } from "../../../stores/models/ITag";
import tags from "../../../stores/Tags";
import contacts from "../../../stores/Contacts";

interface Option {
    value: number;
    label: string;
}

const TagsFilter = () => {
    const makeOption = (tag: ITag) => {
        return { value: tag.id, label: tag.name };
    };

    const fromOption = (option: Option) => {
        return tags.tags.find((tag) => tag.id === +option.value);
    };

    const options = tags.tags.map((tag) => makeOption(tag));

    const selectHandler = (option: SingleValue<Option>) => {
        if (option) {
            const tag = fromOption(option);
            if (tag) {
                contacts.setFilterByTag(tag);
                return;
            }
        }
        contacts.setFilterByTag(null);
    };

    return (
        <Select
            styles={{
                control: (style) => ({
                    ...style,
                    marginRight: 8,
                    minHeight: 0,
                    width: 140,
                }),
                dropdownIndicator: (style) => ({
                    ...style,
                    padding: "5px 8px",
                }),
            }}
            placeholder={"Filter by folder"}
            options={[{ value: 0, label: "All folders" }, ...options]}
            onChange={selectHandler}
        />
    );
};

export default TagsFilter;

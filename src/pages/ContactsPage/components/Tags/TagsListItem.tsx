import React, { useState } from "react";
import { ITag } from "../../../../stores/models/ITag";
import classNames from "classnames";
import { allColors, colors } from "../../../../utils/colors";
import tags from "../../../../stores/Tags";
import ColorPicker from "./ColorPicker";

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
    const [color, setColor] = useState<colors>(tag.color);

    const editClickHandler = () => {
        setEditing(true);
    };

    const saveClickHandler = () => {
        const newTag: ITag = {
            id: tag.id,
            name,
            color: color,
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
            <tr>
                <td style={{ textAlign: "left", width: "40%" }}>
                    <input
                        type="text"
                        className="input form-control"
                        placeholder={"Type folder name"}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </td>
                <td style={{ textAlign: "center" }} className="client-status">
                    <div style={{ display: "inline-flex" }}>
                        {allColors.map((c) => (
                            <ColorPicker
                                key={c}
                                onClick={setColor}
                                active={c === color}
                                color={c}
                            />
                        ))}
                    </div>
                </td>
                <>
                    {!isNew ? (
                        <td
                            onClick={deleteClickHandler}
                            style={{
                                cursor: "pointer",
                                textAlign: "center",
                                width: "5%",
                            }}
                        >
                            <i className="fa fa-trash"></i>
                        </td>
                    ) : (
                        <td></td>
                    )}
                    <td
                        onClick={saveClickHandler}
                        style={{
                            cursor: "pointer",
                            textAlign: "center",
                            width: "5%",
                        }}
                    >
                        <i className="fa fa-check"></i>
                    </td>
                </>
            </tr>
        );
    }

    return (
        <tr>
            <td style={{ textAlign: "left", width: "40%", paddingLeft: 15 }}>
                <span className="client-link">{tag.name}</span>
            </td>
            <td style={{ textAlign: "center" }} className="client-status">
                <span className={classNames(["label", `label-${tag.color}`])}>
                    {tag.name}
                </span>
            </td>
            <td></td>
            <td
                onClick={editClickHandler}
                style={{ cursor: "pointer", width: "5%" }}
            >
                <i className="fa fa-gear"></i>
            </td>
        </tr>
    );
};

export default TagsListItem;

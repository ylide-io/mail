import React, {useEffect} from 'react';
import {observer} from "mobx-react";
import tags from "../../../stores/Tags";
import Tag from "./Tag";
import mailer from "../../../stores/Mailer";
import TagsEmpty from "../TagsEmpty";

const TagsList = observer(() => {

    useEffect(() => {
        tags.getTags()
    }, [])

    return (
        <>
            {tags.tags.length ?
                <ul className="folder-list m-b-md p-0">
                    {tags.tags.map(elem => <Tag key={elem.id} isActive={mailer.activeFolderId === elem.id} tagId={elem.id} circleColor={elem.color} text={elem.name} />)}
                </ul>
                :
                <TagsEmpty />
            }
        </>
    );
});

export default TagsList;

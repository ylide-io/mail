import React, {useEffect} from 'react';
import tags from "../../../../stores/Tags";
import {observer} from "mobx-react";
import TagsListItem from "./TagsListItem";
import TagsEmpty from "./TagsEmpty";

const TagsList = observer(() => {

    useEffect(() => {
        tags.retrieveTags()
    }, [])

    return (
        <>
            {!tags.tags.length && !tags.newTag ?
                <TagsEmpty/>
                :
                <table className="table table-striped table-hover">
                    <tbody>
                    {tags.newTag && <TagsListItem isNew={true} tag={{...tags.newTag}} />}
                    {tags.tags.map(tag => <TagsListItem key={tag.id} tag={{...tag}} />)}
                    </tbody>
                </table>
            }
        </>

    );
});

export default TagsList;

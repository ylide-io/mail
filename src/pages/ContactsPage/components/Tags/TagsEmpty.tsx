import React from 'react';
import tags from "../../../../stores/Tags";

const TagsEmpty = () => {

    const createTag = () => {
        tags.generateNewTag()
    }

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
            padding: "100px 20px 150px"
        }}>
            <h3>Your folders list is empty yet.</h3>
            <div style={{marginTop: 6}}>
                <span onClick={createTag} style={{cursor: "pointer", color: "#1ab394", fontWeight: "bold"}}>Create</span>
                <span> new folder for message sorting.</span>
            </div>
        </div>
    );
};

export default TagsEmpty;

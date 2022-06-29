import React from 'react';
import TagsList from "./TagsList";

const TagsTab = () => {
    return (
        <div id="tab-2" className="tab-pane active">
            <div style={{height: "100%"}} className="full-height-scroll">
                <div style={{height: "100%"}} className="table-responsive">
                    <TagsList />
                </div>
            </div>
        </div>
    );
};

export default TagsTab;

import React from 'react';
import mailbox from "../../../../stores/Mailbox";
import {observer} from "mobx-react";

const SubjectEditor = observer(() => {
    return (
        <div className="form-group row">
            <label className="col-sm-1 col-form-label">Subject:</label>
            <div className="col-sm-11">
                <input
                    type="text"
                    className="form-control"
                    value={mailbox.subject}
                    onChange={(e) => mailbox.setSubject(e.target.value)}
                />
            </div>
        </div>
    );
});

export default SubjectEditor;

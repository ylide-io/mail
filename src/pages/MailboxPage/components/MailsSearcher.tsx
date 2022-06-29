import React, {ChangeEvent, FormEvent, useEffect} from 'react';
import {observer} from "mobx-react";
import mailer from "../../../stores/Mailer";

const MailsSearcher = observer(() => {
    const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
        mailer.setSearchingText(e.target.value || "")
    }

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
                mailer.retrieveFirstPage()
        }, 400)

        return () => clearTimeout(delayDebounce)
    }, [mailer.searchingText])

    const submitHandler = (e: FormEvent) => {
        e.preventDefault()
    }

    return (
        <form method="get" onSubmit={submitHandler} className="float-right mail-search">
            <div className="input-group">
                <input
                    value={mailer.searchingText}
                    onChange={changeHandler}
                    type="text"
                    className="form-control form-control-sm"
                    name="search"
                    placeholder="Search mail"
                />
                <div className="input-group-append">
                    <button type="submit" className="btn btn-sm btn-primary">
                        Search
                    </button>
                </div>
            </div>
        </form>
    );
});

export default MailsSearcher;

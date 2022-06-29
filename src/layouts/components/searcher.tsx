import React, {useState} from 'react';

const Searcher = () => {
    const [searchingText, setSearchingText] = useState("")

    return (
        <div style={{position: "relative"}}>

            <div className="dropdown">
                <form role="search" className="navbar-form-custom" action="search_results.html">
                    <div className="form-group">
                        <input
                            value={searchingText}
                            onChange={e => setSearchingText(e.target.value)}
                            type="text"
                            placeholder="Search for something..."
                            className="form-control"
                            name="top-search"
                            id="top-search"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Searcher;

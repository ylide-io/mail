import { observer } from 'mobx-react';
import React, { FormEvent, useEffect, useState } from 'react';

const MailsSearcher = observer(() => {
	const [searchingText, setSearchingText] = useState('');

	useEffect(() => {
		if (!searchingText) {
			return () => {};
		}

		const delayDebounce = setTimeout(() => {
			// mailer.setSearchingText(searchingText);
			// mailer.retrieveFirstPage();
		}, 400);

		return () => clearTimeout(delayDebounce);
	}, [searchingText]);

	const submitHandler = (e: FormEvent) => {
		e.preventDefault();
	};

	return (
		<form method="get" onSubmit={submitHandler} className="float-right mail-search">
			<div className="input-group">
				<input
					value={'none'} //mailer.searchingText}
					onChange={e => setSearchingText(e.target.value)}
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

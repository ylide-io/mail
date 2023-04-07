import React from 'react';

const TagsEmpty = () => {
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				flexDirection: 'column',
				alignItems: 'center',
				padding: '100px 20px 150px',
			}}
		>
			<h3>Your tag list is empty yet.</h3>
		</div>
	);
};

export default TagsEmpty;

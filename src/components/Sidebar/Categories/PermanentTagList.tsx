import React from 'react';
import PermanentTag from './PermanentTag';
import { observer } from 'mobx-react';
import mailer from '../../../stores/Mailer';

interface PermanentTagListProps {
	viewFolder: (arg1: 'Inbox' | 'Archive') => void;
}

const PermanentTagList: React.FC<PermanentTagListProps> = observer(({ viewFolder }) => {
	return (
		<ul className="folder-list m-b-md" style={{ padding: 0 }}>
			<PermanentTag active={true} text={'Inbox'} onClick={() => viewFolder('Inbox')} />
			{/* <PermanentTag active={false} text={"Archive"} onClick={() => viewFolder("Archive")} /> */}
		</ul>
	);
});

export default PermanentTagList;

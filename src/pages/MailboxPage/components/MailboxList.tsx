import MailboxListRow from './MailboxListRow';
import { observer } from 'mobx-react';
import mailList from '../../../stores/MailList';
import { Loader } from '../../../controls/Loader';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useEffect, useState } from 'react';
import MailboxEmpty from './MailboxEmpty';
import domain from '../../../stores/Domain';

const MailboxList = observer(() => {
	const [scrollParams, setScrollParams] = useState({
		offset: 0,
		height: 0,
	});

	const messagesCount = mailList.messages.length;
	const isLoading = mailList.loading;
	const pageAvailable = mailList.isNextPageAvailable;
	const itemSize = 40;

	useEffect(() => {
		const itemsHeight = itemSize * messagesCount;
		const offsetToEnd = itemsHeight - (scrollParams.height + scrollParams.offset);
		if (offsetToEnd < itemSize && pageAvailable && !isLoading) {
			mailList.nextPage();
		}
	}, [scrollParams, isLoading, messagesCount, pageAvailable]);

	return (
		<div className="mail-box">
			{mailList.firstLoading ? (
				<div style={{ height: 400 }}>
					{mailList.loading}
					<Loader
						reason={`Retrieving your mails from ${Object.keys(domain.blockchains).length} blockchains`}
					/>
				</div>
			) : mailList.messages.length ? (
				<AutoSizer>
					{({ width, height }) => (
						<FixedSizeList
							itemSize={itemSize}
							width={width}
							height={height}
							itemData={mailList.messages}
							onScroll={props => {
								setScrollParams({
									offset: props.scrollOffset,
									height,
								});
							}}
							itemCount={messagesCount + (pageAvailable ? 1 : 0)}
						>
							{({ index, style, data, isScrolling }) =>
								index === messagesCount ? (
									<div style={Object.assign({ height: itemSize, textAlign: 'center' }, style)}>
										Loading...
									</div>
								) : (
									<MailboxListRow style={style} message={data[index]} key={index} />
								)
							}
						</FixedSizeList>
					)}
				</AutoSizer>
			) : (
				<MailboxEmpty />
			)}
		</div>
	);
});

export default MailboxList;

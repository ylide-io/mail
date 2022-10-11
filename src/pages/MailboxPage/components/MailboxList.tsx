import MailboxListRow from './MailboxListRow';
import { observer } from 'mobx-react';
import mailList from '../../../stores/MailList';
import { Loader } from '../../../controls/Loader';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useEffect, useState } from 'react';

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
			console.log('np');
			mailList.nextPage();
		}
	}, [scrollParams, isLoading, messagesCount, pageAvailable]);

	console.log('pageAvailable: ', pageAvailable);
	console.log('loading: ', mailList.loading);

	return (
		<div className="mail-box">
			{mailList.firstLoading ? (
				<div style={{ height: 400 }}>
					{mailList.loading}
					<Loader />
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
									<div style={Object.assign({ height: itemSize, background: 'red' }, style)}>
										Do you want more, bitch?
									</div>
								) : (
									<MailboxListRow style={style} message={data[index]} key={index} />
								)
							}
						</FixedSizeList>
					)}
				</AutoSizer>
			) : (
				// <table className="table table-hover table-mail">
				// 	<tbody>
				// 		{mailList.messages.map(msg => (
				// 			<MailboxListRow key={msg.msgId} message={msg} />
				// 		))}
				// 	</tbody>
				// </table>
				'test'
				// <>{!mailer.searchingText && !mailer.filteringMethod && <MailboxEmpty />}</>
			)}
		</div>
	);
});

export default MailboxList;

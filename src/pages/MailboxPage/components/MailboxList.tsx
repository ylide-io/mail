import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import { Loader } from '../../../controls/Loader';
import domain from '../../../stores/Domain';
import mailList, { ILinkedMessage } from '../../../stores/MailList';
import { useNav } from '../../../utils/navigate';
import { useWindowSize } from '../../../utils/useWindowSize';
import MailboxEmpty from './MailboxEmpty';
import MailboxListRow from './MailboxListRow/MailboxListRow';

const MailboxListInner = observer(({ width, height }: { width: number; height: number }) => {
	const navigate = useNav();

	const [scrollParams, setScrollParams] = useState({
		offset: 0,
		height: 0,
	});
	const { windowWidth } = useWindowSize();

	const messagesCount = mailList.messages.length;
	const isLoading = mailList.loading;
	const pageAvailable = mailList.isNextPageAvailable;
	const isHighRow = windowWidth <= 630;
	const itemSize = isHighRow ? 80 : 40;

	useEffect(() => {
		const itemsHeight = itemSize * messagesCount;
		const offsetToEnd = itemsHeight - (scrollParams.height + scrollParams.offset);
		if (offsetToEnd < itemSize && pageAvailable && !isLoading) {
			mailList.nextPage();
		}
	}, [itemSize, scrollParams, isLoading, messagesCount, pageAvailable]);

	const onFilterBySenderClick =
		mailList.activeFolderId === 'inbox' && !mailList.filterBySender
			? (senderAddress: string) => {
					navigate({
						search: { sender: senderAddress },
					});
			  }
			: undefined;

	return (
		<FixedSizeList
			itemSize={itemSize}
			width={width}
			height={height}
			style={{ padding: '0 0 12px' }}
			itemData={mailList.messages}
			onScroll={props => {
				setScrollParams({
					offset: props.scrollOffset,
					height,
				});
			}}
			itemCount={messagesCount + (pageAvailable ? 1 : 0)}
		>
			{({ index, style, data }: ListChildComponentProps<ILinkedMessage[]>) => {
				return index === messagesCount ? (
					<div style={Object.assign({ height: itemSize, textAlign: 'center' }, style)}>Loading...</div>
				) : (
					<MailboxListRow
						style={style}
						message={data[index]}
						key={index}
						onFilterBySenderClick={onFilterBySenderClick}
					/>
				);
			}}
		</FixedSizeList>
	);
});

const MailboxList = observer(() => {
	return (
		<div className="mailbox">
			{mailList.firstLoading ? (
				<div style={{ height: 400 }}>
					{mailList.loading}
					<Loader
						reason={`Retrieving your mails from ${Object.keys(domain.blockchains).length} blockchains`}
					/>
				</div>
			) : mailList.messages.length ? (
				<AutoSizer>{({ width, height }) => <MailboxListInner width={width} height={height} />}</AutoSizer>
			) : (
				<MailboxEmpty />
			)}
		</div>
	);
});

export default MailboxList;

import mailbox from '../../../../../stores/Mailbox';
import './MailboxCalendarEventEditor.scss';
import { smallButtonIcons } from '../../../../../components/smallButton/smallButton';
import { observer } from 'mobx-react';
import { useRef } from 'react';
import { Button, DatePicker, Input } from 'antd';
import { RangePickerProps } from 'antd/lib/date-picker';

const MailboxCalendarEventEditor = observer(() => {
    const eventSectionRef = useRef<HTMLDivElement>(null);
    const calculatedHeight = useRef(0);

    const onOk = (value: RangePickerProps['value']) => {
        if (value) {
            const [start, end] = value;
            if (start && end) {
                mailbox.event.start = start.toDate();
                mailbox.event.end = end.toDate();
            }
        }
    }

    const height = mailbox.event.active ? `${calculatedHeight.current}px` : '0px';
    return (
        <>
            <div className='add-event-btn-wrapper'>
                <Button
                    type='primary'
                    className='add-event-btn'
                    onClick={() => {
                        calculatedHeight.current = eventSectionRef.current?.clientHeight || 0;
                        mailbox.event.active = !mailbox.event.active
                    }}
                    title={mailbox.event.active ? 'Remove Calendar Event' : 'Add Calendar Event'}
                    icon={<i className={`fa ${mailbox.event.active ? smallButtonIcons.cross : smallButtonIcons.calendar}`} />}
                >
                    {mailbox.event.active ? 'Remove Event' : 'Add Event'}
                </Button>
            </div>
            <div style={{ height: height, minHeight: height }} className={`mail-meta compose-meta add-event-section ${!mailbox.event.active && 'inactive'}`}>
                <div className='add-event-section-content' ref={eventSectionRef}>
                    <div className="mail-params">
                        <div className="mmp-row">
                            <label className="mmp-row-title">Summary:</label>
                            <div className="mmp-row-value">
                                <Input
                                    type="text"
                                    style={{ width: '100%' }}
                                    value={mailbox.event.summary}
                                    onChange={e => (mailbox.event.summary = e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="mmp-row">
                            <label className="mmp-row-title">When:</label>
                            <div className="mmp-row-value">
                                <DatePicker.RangePicker
                                    showTime={{ format: 'HH:mm' }}
                                    format="YYYY-MM-DD HH:mm"
                                    minuteStep={5}
                                    onOk={onOk}
                                />
                            </div>
                        </div>
                        <div className="mmp-row">
                            <label className="mmp-row-title">Location:</label>
                            <div className="mmp-row-value">
                                <Input
                                    type="text"
                                    style={{ width: '100%' }}
                                    value={mailbox.event.location}
                                    onChange={e => (mailbox.event.location = e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="mmp-row">
                            <label className="mmp-row-title">Description:</label>
                            <div className="mmp-row-value">
                                <Input.TextArea
                                    rows={4}
                                    value={mailbox.event.description}
                                    onChange={e => (mailbox.event.description = e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});

export default MailboxCalendarEventEditor;

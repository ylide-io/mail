import mailbox from '../../../../../stores/Mailbox';
import './MailboxCalendarEventEditor.scss';
import SmallButton, { smallButtonColors, smallButtonIcons } from '../../../../../components/smallButton/smallButton';
import { observer } from 'mobx-react';
import { useRef } from 'react';

const MailboxCalendarEventEditor = observer(() => {
    const eventSectionRef = useRef<HTMLDivElement>(null);
    const calculatedHeight = useRef(0);

    return (
        <>
            <div className='add-event-btn'>
                <SmallButton
                    onClick={() => {
                        calculatedHeight.current = eventSectionRef.current?.clientHeight || 0;
                        mailbox.event.active = !mailbox.event.active
                    }}
                    text={mailbox.event.active ? 'Remove Event' : 'Add Event'}
                    color={smallButtonColors.green}
                    title={mailbox.event.active ? 'Remove Calendar Event' : 'Add Calendar Event'}
                    icon={mailbox.event.active ? smallButtonIcons.cross : smallButtonIcons.calendar}
                />
            </div>
            <div style={{ height: mailbox.event.active ? `${calculatedHeight.current}px` : '0px' }} className={`add-event-section ${!mailbox.event.active && 'inactive'}`}>
                <div className='add-event-section-content' ref={eventSectionRef}>
                    <div className="form-group row">
                        <label className="col-sm-1 col-form-label">Summary:</label>
                        <div className="col-sm-11">
                            <input
                                type="text"
                                className="form-control"
                                value={mailbox.event.summary}
                                onChange={e => (mailbox.event.summary = e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-sm-1 col-form-label">Location:</label>
                        <div className="col-sm-11">
                            <input
                                type="text"
                                className="form-control"
                                value={mailbox.event.location}
                                onChange={e => (mailbox.event.location = e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-sm-1 col-form-label">Start:</label>
                        <div className="col-sm-11">
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={mailbox.event.startDateTime}
                                onChange={e => (mailbox.event.startDateTime = e.target.value)}
                                max={mailbox.event.endDateTime}
                            />
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-sm-1 col-form-label">End:</label>
                        <div className="col-sm-11">
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={mailbox.event.endDateTime}
                                onChange={e => (mailbox.event.endDateTime = e.target.value)}
                                min={mailbox.event.startDateTime}
                            />
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-sm-1 col-form-label">Description:</label>
                        <div className="col-sm-11">
                            <textarea
                                className="form-control"
                                value={mailbox.event.description}
                                onChange={e => (mailbox.event.description = e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});

export default MailboxCalendarEventEditor;

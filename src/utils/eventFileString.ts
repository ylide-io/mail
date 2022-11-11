import ICalParser from "ical-js-parser";
import { createCalendarEventDateString } from "./calendarEventDate";

const separator = "===~~~===EVENTFILE===~~~===";

export const isEventFileString = (text: string) => {
    return text.startsWith(separator) && text.endsWith(separator);
}

export const parseEventFileString = (text: string) => {
    const eventString = text.replaceAll(separator, '').replaceAll('<br>', '\n').trim();

    return ICalParser.toJSON(eventString);
}

export const createEventFileString = ({
    organizer,
    attendees,
    startDateTime,
    endDateTime,
    summary,
    description,
    locaiton
}: {
    organizer: string,
    attendees: string[],
    startDateTime: Date,
    endDateTime: Date,
    summary: string,
    description: string,
    locaiton: string,
}) => {
    const eventData = {
        calendar:
        {
            begin: 'VCALENDAR',
            prodid: 'Ylide',
            version: '1',
            end: 'VCALENDAR',
            method: 'REQUEST'
        },
        events:
            [
                {
                    begin: 'VEVENT',
                    dtstamp: {
                        value: createCalendarEventDateString(new Date())
                    },
                    uid: `ylide-${Date.now()}-${Math.round(Math.random() * 10000)}`,
                    summary: summary,
                    description: description,
                    locaiton: locaiton,
                    dtstart: {
                        value: createCalendarEventDateString(startDateTime)
                    },
                    dtend: {
                        value: createCalendarEventDateString(endDateTime)
                    },
                    organizer: {
                        EMAIL: organizer,
                        mailto: organizer
                    },
                    attendee: attendees.map(attendee => ({
                        CUTYPE: "INDIVIDUAL",
                        ROLE: "REQ-PARTICIPANT",
                        EMAIL: attendee,
                        mailto: attendee,
                    })),
                    sequence: '1',
                    end: 'VEVENT',
                }
            ]
    }

    const resultString = ICalParser.toString(eventData);
    return `${separator}\n${resultString}\n${separator}`;
}
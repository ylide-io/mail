import ICalParser from "ical-js-parser";
import { createCalendarEventDateString, formatCalendarEventDateString } from "./calendarEventDate";

export const parseEventFileString = (text: string) => {
    const result = ICalParser.toJSON(text);

    return {
        originalFile: text,
        summary: result.events[0].summary,
        description: result.events[0].description?.replaceAll('\\n', '\n'),
        location: result.events[0].location,
        start: formatCalendarEventDateString(result.events[0].dtstart.value),
        end: formatCalendarEventDateString(result.events[0].dtend.value),
        attendees: result.events[0].attendee?.map(person => person.EMAIL).join(', '),
    }
}

export const createEventFileString = ({
    organizer,
    attendees,
    start,
    end,
    summary,
    description,
    location
}: {
    organizer: string,
    attendees: string[],
    start: Date,
    end: Date,
    summary: string,
    description: string,
    location: string,
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
                    location: location,
                    dtstart: {
                        value: createCalendarEventDateString(start)
                    },
                    dtend: {
                        value: createCalendarEventDateString(end)
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
    return resultString;
}
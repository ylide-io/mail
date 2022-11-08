import ICalParser from "ical-js-parser";

const separator = "===~~~===EVENTFILE===~~~===";

export const isEventFileString = (text: string) => {
    return text.startsWith(separator) && text.endsWith(separator);
}

export const parseEventFileString = (text: string) => {
    const eventString = text.replaceAll(separator, '').trim();

    return ICalParser.toJSON(eventString);
}

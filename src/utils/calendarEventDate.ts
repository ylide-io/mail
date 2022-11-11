import moment from "moment";

export const createCalendarEventDateString = (date: Date) => {
    return moment.utc(date).format('YYYYMMDDTHHmmss[Z]');
}

export const parseCalendarEventDateString = (date: string) => {
    return moment(date);
}

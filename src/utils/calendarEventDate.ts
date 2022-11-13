import moment from "moment";

export const createCalendarEventDateString = (date: Date) => {
    return moment.utc(date).format('YYYYMMDDTHHmmss[Z]');
}

export const formatCalendarEventDateString = (date: string) => {
    return moment(date).format('dddd MMM DD, YYYY ⋅ HH:mma');
}

export const isValidCalendarEventDates = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return false;
    return moment(startDate).isBefore(moment(endDate));
}
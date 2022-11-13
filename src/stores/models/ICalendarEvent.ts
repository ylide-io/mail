export interface ICalendarEvent {
    active: boolean;
    startDateTime: string;
    endDateTime: string;
    location: string;
    summary?: string;
    description?: string;
}

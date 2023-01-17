export interface ICalendarEvent {
    active: boolean;
    start: Date;
    end: Date;
    location: string;
    summary?: string;
    description?: string;
}

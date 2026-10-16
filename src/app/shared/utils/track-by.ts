/** trackBy helpers for *ngFor, so lists keep their DOM when the array is rebuilt. */
export const trackByAppointmentId = (_: number, a: { appointmentId: number }) => a.appointmentId;
export const trackById = (_: number, item: { id: number | string }) => item.id;

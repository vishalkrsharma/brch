import { format } from 'date-fns';

export const formatDateLog = (isoDateString: string): string => {
  const date = new Date(isoDateString);
  // Format: "EEE MMM d HH:mm:ss yyyy XXX" where XXX gives +HH:mm, we need +HHmm
  const formatted = format(date, 'EEE MMM d HH:mm:ss yyyy XXX');
  // Replace the colon in timezone offset (e.g., +05:30 -> +0530)
  return formatted.replace(/([+-]\d{2}):(\d{2})$/, '$1$2');
};

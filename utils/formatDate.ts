export const formatDate = (date: Date): string => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;

  return (
    `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ` +
    `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`
  );
};

/**
 * Get calendar date information adjusted for Philippines timezone (UTC+8)
 * @param viewType - The calendar view type ('day', 'week', or 'month')
 * @returns Object containing date information for calendar operations
 */
export const getCalendarDateInfo = (viewType: string = "week") => {
  const now = new Date();
  const philippinesOffset = 8 * 60 * 60 * 1000;
  const currentDate = new Date(now.getTime() + philippinesOffset);
  const currentDateStr = currentDate.toISOString().split("T")[0];

  const tomorrow = new Date(currentDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const currentHour = currentDate.getHours();
  const currentMinute = currentDate.getMinutes();
  const startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);

  let startDate: Date;
  let endDate: Date;

  switch (viewType) {
    case "day":
      startDate = startOfDay;
      endDate = new Date(startOfDay);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      startDate = startOfDay;
      endDate = new Date(startOfDay);
      endDate.setDate(endDate.getDate() + 4);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "month":
      startDate = startOfDay;
      endDate = new Date(startOfDay);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      startDate = startOfDay;
      endDate = new Date(startOfDay);
      endDate.setDate(endDate.getDate() + 4);
      endDate.setHours(23, 59, 59, 999);
  }

  const dateFormat = "%Y-%m-%d";

  return {
    currentDate,
    currentDateStr,
    tomorrow,
    tomorrowStr,
    currentHour,
    currentMinute,
    startDate,
    endDate,
    startOfDay,
    dateFormat,
  };
};

/**
 * Format dates for section attendance, handling date ranges correctly
 * @param startDate - The start date for the date range
 * @param endDate - Optional end date for the date range
 * @returns Object with formatted dates array and date range information
 */
export const formatDatesForAttendance = (
  startDate: Date,
  endDate?: Date
): {
  formattedDates: Array<{
    date: Date;
    dayNumber: number;
    weekday: string;
    dayKey: number;
    dateStart: Date;
    dateEnd: Date;
    isoDateString: string;
  }>;
} => {
  startDate.setHours(0, 0, 0, 0);
  let earliestDate: Date;
  let latestDate: Date;
  let daysToFetch = 7;

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
    const isReversedDateRange = startDate > endDate;

    if (isReversedDateRange) {
      earliestDate = new Date(endDate);
      earliestDate.setHours(0, 0, 0, 0);
      latestDate = new Date(startDate);
    } else {
      earliestDate = new Date(startDate);
      latestDate = new Date(endDate);
    }
    const diffTime = Math.abs(latestDate.getTime() - earliestDate.getTime());
    daysToFetch = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } else {
    earliestDate = new Date(startDate);
    earliestDate.setDate(earliestDate.getDate() - 6);
    earliestDate.setHours(0, 0, 0, 0);
    latestDate = new Date(startDate);
  }
  const formattedDates = [];
  for (let i = 0; i < daysToFetch; i++) {
    const date = new Date(earliestDate);
    date.setDate(date.getDate() + i);
    if (latestDate && date > latestDate) {
      break;
    }

    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    formattedDates.push({
      date: date,
      dayNumber: date.getDate(),
      weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()],
      dayKey: date.getDay(),
      dateStart: dateStart,
      dateEnd: dateEnd,
      isoDateString: date.toISOString().split("T")[0],
    });
  }

  return { formattedDates };
};

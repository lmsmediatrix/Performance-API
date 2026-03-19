interface MetricComparison {
  current: number | string;
  previous: number | string;
  trend: "increased" | "decreased" | "unchanged";
  change: number;
}

export function getMetricComparison(current: number, previous: number): MetricComparison {
  return {
    current,
    previous,
    trend: current > previous ? "increased" : current < previous ? "decreased" : "unchanged",
    change: Math.abs(current - previous),
  };
}

export function formatRatio(ratio: number): string {
  return ratio === 0 ? "0:0" : `1:${Math.ceil(ratio)}`;
}

export function getTeacherStudentRatioComparison(
  current: number,
  previous: number
): MetricComparison {
  return {
    current: formatRatio(current),
    previous: formatRatio(previous),
    trend: current > previous ? "increased" : current < previous ? "decreased" : "unchanged",
    change: Math.abs(Math.ceil(current - previous)),
  };
}

interface DateRange {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

export function getDateRange(filter: string): DateRange {
  const today = new Date();
  let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

  switch (filter) {
    case "today":
      currentStart = new Date(today.setHours(0, 0, 0, 0));
      currentEnd = new Date(today.setHours(23, 59, 59, 999));
      previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - 1);
      previousEnd = new Date(currentEnd);
      previousEnd.setDate(currentEnd.getDate() - 1);
      break;
    case "week":
      currentStart = new Date(today);
      currentStart.setDate(today.getDate() - today.getDay());
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + 6);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - 7);
      previousEnd = new Date(currentEnd);
      previousEnd.setDate(currentEnd.getDate() - 7);
      break;
    case "month":
      currentStart = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
      currentEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      previousStart = new Date(currentStart);
      previousStart.setMonth(currentStart.getMonth() - 1);
      previousEnd = new Date(currentEnd);
      previousEnd.setMonth(currentEnd.getMonth() - 1);
      break;
    case "year":
      currentStart = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
      currentEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      previousStart = new Date(currentStart);
      previousStart.setFullYear(currentStart.getFullYear() - 1);
      previousEnd = new Date(currentEnd);
      previousEnd.setFullYear(currentEnd.getFullYear() - 1);
      break;
    default:
      throw new Error("Invalid filter specified");
  }

  return { currentStart, currentEnd, previousStart, previousEnd };
}

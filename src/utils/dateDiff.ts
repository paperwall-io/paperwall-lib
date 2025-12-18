
export const daysOld = (givenDate: Date) => {
  const currentDate = new Date();

  // // Set current date time to midnight for accurate day difference calculation
  // currentDate.setHours(0, 0, 0, 0);

  // Calculate the difference in days
  const dayDifference = (currentDate.getTime() - givenDate.getTime()) / (1000 * 3600 * 24);
  // Check if the difference is exactly n days
  return Math.round(dayDifference) as number
}

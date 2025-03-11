/**
 * Calculate the next daily reset time (5:00 AM UTC)
 */
export const getNextDailyReset = (): Date => {
  // Get current date in UTC
  const now = new Date();
  
  // Set the reset time (5:00 AM UTC)
  const resetTime = new Date(now);
  resetTime.setUTCHours(5, 0, 0, 0);
  
  // If reset time has already passed today, set it for tomorrow
  if (now > resetTime) {
    resetTime.setDate(resetTime.getDate() + 1);
  }
  
  return resetTime;
};

/**
 * Calculate the next season reset (last Monday of the month at 5:00 AM UTC)
 */
export const getNextSeasonReset = (): Date => {
  // Get the timestamp provided by the user
  const targetTimestamp = 1743397200; // July 29, 2025 05:00:00 UTC timestamp
  const targetDate = new Date(targetTimestamp * 1000);
  
  // Get current date
  const now = new Date();
  
  // If the target date is in the future, use it as the next reset
  if (now < targetDate) {
    return targetDate;
  }
  
  // Otherwise, calculate the next season reset date
  // Get the current month and year
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // First day of next month
  const firstDayNextMonth = new Date(year, month + 1, 1);
  
  // Go back one day to get the last day of current month
  const lastDayOfMonth = new Date(firstDayNextMonth);
  lastDayOfMonth.setDate(lastDayOfMonth.getDate() - 1);
  
  // Find the last Monday of the month by working backwards from the last day
  const lastMonday = new Date(lastDayOfMonth);
  
  // Go back until we find a Monday (day 1)
  while (lastMonday.getDay() !== 1) {
    lastMonday.setDate(lastMonday.getDate() - 1);
  }
  
  // Set the time to 5:00 AM UTC
  lastMonday.setUTCHours(5, 0, 0, 0);
  
  // If we've already passed the last Monday of this month, get the last Monday of next month
  if (now > lastMonday) {
    // Get the next month
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    // Get the first day of the month after next month
    const firstDayTwoMonthsAhead = new Date(nextYear, nextMonth + 1, 1);
    
    // Get the last day of next month
    const lastDayNextMonth = new Date(firstDayTwoMonthsAhead);
    lastDayNextMonth.setDate(lastDayNextMonth.getDate() - 1);
    
    // Find the last Monday of next month
    const nextLastMonday = new Date(lastDayNextMonth);
    while (nextLastMonday.getDay() !== 1) {
      nextLastMonday.setDate(nextLastMonday.getDate() - 1);
    }
    
    // Set the time to 5:00 AM UTC
    nextLastMonday.setUTCHours(5, 0, 0, 0);
    
    return nextLastMonday;
  }
  
  return lastMonday;
};

/**
 * Get the current Legend League season info
 */
export const getCurrentSeasonInfo = (): { name: string; day: number } => {
  // Get current date
  const now = new Date();
  
  // Get month and year
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Find the first day of the month
  const firstDayOfMonth = new Date(year, month, 1);
  
  // Find the last Monday of the previous month
  const lastMondayPrevMonth = new Date(year, month, 1);
  lastMondayPrevMonth.setDate(0); // Last day of previous month
  
  const lastDayPrevWeek = lastMondayPrevMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  if (lastDayPrevWeek === 1) {
    // If the last day of prev month is a Monday, use it
  } else if (lastDayPrevWeek === 0) {
    // If the last day is a Sunday, go back 6 days
    lastMondayPrevMonth.setDate(lastMondayPrevMonth.getDate() - 6);
  } else {
    // Otherwise, go back to the previous Monday
    lastMondayPrevMonth.setDate(lastMondayPrevMonth.getDate() - (lastDayPrevWeek - 1));
  }
  
  // Calculate day number (days since season start)
  const seasonStartDate = lastMondayPrevMonth;
  const currentDay = Math.floor((now.getTime() - seasonStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    name: `${monthNames[month]} ${year}`,
    day: currentDay
  };
};

/**
 * Format a date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

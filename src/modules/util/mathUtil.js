/**
 * Calculates the age based on the given date of birth.
 *
 * @param {string} dateOfBirth - The date of birth in the format 'YYYY-MM-DD'.
 * @return {number} The calculated age.
 */
function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculates the dynamic time ago representation based on the given date of birth.
 *
 * @param {string} dateFromThePast - The date of birth in the format 'YYYY-MM-DD'.
 * @return {string} The dynamic age representation.
 */
function calculateTimeAgo(dateFromThePast) {
  const dob = new Date(dateFromThePast);
  const today = new Date();

  // Calculate the time difference in milliseconds
  const timeDiff = today.getTime() - dob.getTime();

  // Calculate the time difference in days, months, and years
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  const monthsDiff =
    today.getMonth() -
    dob.getMonth() +
    12 * (today.getFullYear() - dob.getFullYear());
  const yearsDiff = today.getFullYear() - dob.getFullYear();

  if (daysDiff === 1) {
    return "1 day ago";
  } else if (daysDiff > 1 && daysDiff < 30) {
    return `${daysDiff} days ago`;
  } else if (monthsDiff === 1) {
    return "1 month ago";
  } else if (monthsDiff > 1 && monthsDiff < 12) {
    return `${monthsDiff} months ago`;
  } else if (yearsDiff === 1) {
    return "1 year ago";
  } else {
    return `${yearsDiff} years ago`;
  }
}

module.exports = {
  calculateAge,
  calculateTimeAgo,
};

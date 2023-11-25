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
    age -= 1;
  }

  return age;
}

module.exports = {
  calculateAge,
};

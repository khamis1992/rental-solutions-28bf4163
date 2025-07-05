
/**
 * User input validation utility functions
 */

// Utility function to validate postal code
export const isValidPostalCode = (postalCode: string): boolean => {
  const regex = /^[0-9]{5}(?:-[0-9]{4})?$/;
  return regex.test(postalCode);
};

// Utility function to validate username
export const isValidUsername = (username: string): boolean => {
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  return regex.test(username);
};

// Utility function to validate password
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

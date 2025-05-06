
/**
 * Payment-related validation utility functions
 */

// Utility function to validate credit card number
export const isValidCreditCardNumber = (cardNumber: string): boolean => {
  const regex = /^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;
  return regex.test(cardNumber);
};

// Utility function to validate expiry date (MM/YY)
export const isValidExpiryDateFormat = (expiryDate: string): boolean => {
  const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
  return regex.test(expiryDate);
};

// Utility function to validate CVV
export const isValidCVV = (cvv: string): boolean => {
  const regex = /^[0-9]{3,4}$/;
  return regex.test(cvv);
};

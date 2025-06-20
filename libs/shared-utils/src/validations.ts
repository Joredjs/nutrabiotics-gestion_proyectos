import { VALIDATION_RULES } from './constants';

export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL.PATTERN.test(email);
};

export const validatePassword = (
  password: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    errors.push(
      `La contraseña debe ser de al menos ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} caracteres`
    );
  }

  if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    errors.push(
      `La contrasela no puede tener más de ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} caracteres`
    );
  }

  if (!VALIDATION_RULES.PASSWORD.PATTERN.test(password)) {
    errors.push(
      'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateName = (name: string): boolean => {
  return (
    name.length >= VALIDATION_RULES.NAME.MIN_LENGTH &&
    name.length <= VALIDATION_RULES.NAME.MAX_LENGTH
  );
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateDateRange = (startDate: Date, endDate?: Date): boolean => {
  if (!endDate) return true;
  return startDate <= endDate;
};

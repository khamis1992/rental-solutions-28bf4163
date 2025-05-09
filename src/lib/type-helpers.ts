// Fix the line causing the error
export const asArray = <T>(value: T | T[]): T[] => {
  if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
};

export const truncateString = (str: string, maxLength: number) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

export const formatDate = (date: Date | string): string => {
  try {
    const dt = typeof date === 'string' ? new Date(date) : date;
    return dt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid Date';
  }
};

export const formatTime = (date: Date | string): string => {
  try {
    const dt = typeof date === 'string' ? new Date(date) : date;
    return dt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return 'Invalid Time';
  }
};

export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^[0-9]{8,15}$/;
  return phoneRegex.test(phoneNumber);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateRandomBoolean = (): boolean => {
  return Math.random() < 0.5;
};

export const generateRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

export const generateRandomArray = <T>(count: number, callback: () => T): T[] => {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(callback());
  }
  return result;
};

export const generateRandomObject = <T>(keys: string[], callback: (key: string) => any): T => {
  const result: any = {};
  for (const key of keys) {
    result[key] = callback(key);
  }
  return result as T;
};

export const generateRandomEnumValue = <T>(enumType: { [s: string]: T }): T => {
  const enumValues = Object.values(enumType) as T[];
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex];
};

export const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generateRandomColor = (): string => {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
};

export const generateRandomImageUrl = (width: number = 200, height: number = 200): string => {
  return `https://picsum.photos/${width}/${height}`;
};

export const generateAvatarUrl = (name: string): string => {
  const initials = name.split(' ').map(n => n[0]).join('');
  return `https://ui-avatars.com/api/?name=${initials}&background=random`;
};

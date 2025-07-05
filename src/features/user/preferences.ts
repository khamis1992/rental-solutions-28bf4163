
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    defaultView: 'grid' | 'list';
    itemsPerPage: number;
  };
}

export const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  dashboard: {
    defaultView: 'grid',
    itemsPerPage: 10,
  },
};

export const getUserPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem('user-preferences');
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
  }
  
  return defaultPreferences;
};

export const saveUserPreferences = (preferences: Partial<UserPreferences>): boolean => {
  try {
    const current = getUserPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem('user-preferences', JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
};

export const resetUserPreferences = (): boolean => {
  try {
    localStorage.removeItem('user-preferences');
    return true;
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    return false;
  }
};

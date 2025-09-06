// Utility functions for the app

/**
 * Format a price with currency symbol
 */
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

/**
 * Format a date for display
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Format a date for chat context (more detailed)
 */
export const formatDateForChat = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Calculate trip duration in days
 */
export const calculateTripDuration = (startDate: Date, endDate: Date): number => {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Validation utilities
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email.trim()) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please enter a valid email address');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate full name
 */
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name.trim()) {
    errors.push('Name is required');
  } else {
    if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    if (name.trim().length > 50) {
      errors.push('Name must be less than 50 characters');
    }
    if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
      errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate credit card number using Luhn algorithm
 */
export const validateCreditCard = (cardNumber: string): ValidationResult => {
  const errors: string[] = [];
  const cleanNumber = cardNumber.replace(/\s|-/g, '');
  
  if (!cleanNumber) {
    errors.push('Credit card number is required');
  } else {
    if (!/^\d{13,19}$/.test(cleanNumber)) {
      errors.push('Credit card number must be 13-19 digits');
    } else {
      // Luhn algorithm
      const luhnCheck = (num: string) => {
        let sum = 0;
        let isEven = false;
        
        for (let i = num.length - 1; i >= 0; i--) {
          let digit = parseInt(num.charAt(i), 10);
          
          if (isEven) {
            digit *= 2;
            if (digit > 9) {
              digit -= 9;
            }
          }
          
          sum += digit;
          isEven = !isEven;
        }
        
        return sum % 10 === 0;
      };
      
      if (!luhnCheck(cleanNumber)) {
        errors.push('Invalid credit card number');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate credit card expiry date
 */
export const validateExpiryDate = (expiryDate: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!expiryDate) {
    errors.push('Expiry date is required');
  } else {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiryDate)) {
      errors.push('Expiry date must be in MM/YY format');
    } else {
      const [month, year] = expiryDate.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const now = new Date();
      
      if (expiry < now) {
        errors.push('Card has expired');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate CVV
 */
export const validateCVV = (cvv: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!cvv) {
    errors.push('CVV is required');
  } else {
    if (!/^\d{3,4}$/.test(cvv)) {
      errors.push('CVV must be 3-4 digits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone.trim()) {
    errors.push('Phone number is required');
  } else {
    const phoneRegex = /^\+?1?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s()-]/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate passport number
 */
export const validatePassportNumber = (passport: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!passport.trim()) {
    errors.push('Passport number is required');
  } else {
    if (passport.trim().length < 6 || passport.trim().length > 15) {
      errors.push('Passport number must be 6-15 characters');
    }
    if (!/^[A-Z0-9]+$/.test(passport.trim().toUpperCase())) {
      errors.push('Passport number can only contain letters and numbers');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate date (YYYY-MM-DD format)
 */
export const validateDate = (date: string, label: string = 'Date'): ValidationResult => {
  const errors: string[] = [];
  
  if (!date) {
    errors.push(`${label} is required`);
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      errors.push(`${label} must be in YYYY-MM-DD format`);
    } else {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Invalid ${label.toLowerCase()}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format credit card number for display
 */
export const formatCreditCard = (value: string): string => {
  const cleaned = value.replace(/\s/g, '');
  const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
  
  if (match) {
    return [match[1], match[2], match[3], match[4]]
      .filter(group => group.length > 0)
      .join(' ');
  }
  
  return value;
};

/**
 * Format expiry date for display
 */
export const formatExpiryDate = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,2})(\d{0,2})$/);
  
  if (match) {
    if (match[2]) {
      return `${match[1]}/${match[2]}`;
    } else if (match[1]) {
      return match[1];
    }
  }
  
  return value;
};

// Trip data utilities
export * from './tripData'; 
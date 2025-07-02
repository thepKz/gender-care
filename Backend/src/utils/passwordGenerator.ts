/**
 * Password Generator Utility for Meeting Security
 * Generates secure 8-character passwords for Jitsi meetings
 */

/**
 * Generate secure meeting password
 * @returns 8-character random password (A-Z, 0-9)
 */
export const generateMeetingPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Validate meeting password format
 * @param password - Password to validate
 * @returns boolean
 */
export const isValidMeetingPassword = (password: string): boolean => {
  const regex = /^[A-Z0-9]{8}$/;
  return regex.test(password);
};

/**
 * Generate multiple unique passwords (for testing)
 * @param count - Number of passwords to generate
 * @returns Array of unique passwords
 */
export const generateMultipleMeetingPasswords = (count: number): string[] => {
  const passwords = new Set<string>();
  
  while (passwords.size < count) {
    passwords.add(generateMeetingPassword());
  }
  
  return Array.from(passwords);
};

/**
 * Test password generation and validation
 * For development/testing purposes only
 */
export const testPasswordGenerator = (): void => {
  console.log('🔐 [PASSWORD-GENERATOR-TEST] Testing password generation...');
  
  // Test single password generation
  const password = generateMeetingPassword();
  console.log(`Generated password: ${password}`);
  console.log(`Is valid: ${isValidMeetingPassword(password)}`);
  
  // Test multiple passwords
  const passwords = generateMultipleMeetingPasswords(5);
  console.log(`Generated 5 passwords: ${passwords.join(', ')}`);
  
  // Test validation
  console.log(`Valid password test: ${isValidMeetingPassword('A7K9M2X5')}`);
  console.log(`Invalid password test: ${isValidMeetingPassword('abc123')}`);
  
  console.log('🔐 [PASSWORD-GENERATOR-TEST] Test completed!');
}; 
/**
 * Format customer name for privacy
 * Examples:
 * - Trần Minh Trung → T.M.Trung
 * - Lê Châu Thành → L.C.Thành  
 * - Nguyễn Hồng Bích → N.H.Bích
 * - Võ Thị Mai → V.T.Mai
 */
export const formatCustomerName = (fullName: string): string => {
  if (!fullName || typeof fullName !== 'string') {
    return 'Khách hàng';
  }

  // Split name into parts and remove empty strings
  const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
  
  if (nameParts.length === 0) {
    return 'Khách hàng';
  }
  
  if (nameParts.length === 1) {
    // Single name, return as is
    return nameParts[0];
  }
  
  if (nameParts.length === 2) {
    // Two parts: FirstName LastName → F.LastName
    return `${nameParts[0][0].toUpperCase()}.${nameParts[1]}`;
  }
  
  // Three or more parts: Format as requested
  // First part → First letter + dot
  // Middle parts → First letters + dots  
  // Last part → Full name
  const firstInitial = nameParts[0][0].toUpperCase();
  const middleInitials = nameParts.slice(1, -1).map(part => part[0].toUpperCase()).join('.');
  const lastName = nameParts[nameParts.length - 1];
  
  if (middleInitials) {
    return `${firstInitial}.${middleInitials}.${lastName}`;
  } else {
    return `${firstInitial}.${lastName}`;
  }
};

/**
 * Test cases for the format function
 */
export const testFormatCustomerName = () => {
  const testCases = [
    { input: 'Trần Minh Trung', expected: 'T.M.Trung' },
    { input: 'Lê Châu Thành', expected: 'L.C.Thành' },
    { input: 'Nguyễn Hồng Bích', expected: 'N.H.Bích' },
    { input: 'Võ Thị Mai', expected: 'V.T.Mai' },
    { input: 'Mai Anh', expected: 'M.Anh' },
    { input: 'Mai', expected: 'Mai' },
    { input: '', expected: 'Khách hàng' },
    { input: '   ', expected: 'Khách hàng' },
  ];

  console.log('🧪 Testing formatCustomerName:');
  testCases.forEach(({ input, expected }) => {
    const result = formatCustomerName(input);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} "${input}" → "${result}" (expected: "${expected}")`);
  });
}; 
const password = 'Doctor123!';
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{6,30}$/;

console.log('Password:', password);
console.log('Valid:', regex.test(password));
console.log('Length:', password.length);

// Test from authController requirements:
// - Chữ thường: (?=.*[a-z]) ✓ 'octor'
// - Chữ in hoa: (?=.*[A-Z]) ✓ 'D'  
// - Số: (?=.*\d) ✓ '123'
// - Ký tự đặc biệt: (?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]) ✓ '!'
// - Độ dài 6-30: {6,30} ✓ 10 ký tự

console.log('Components check:');
console.log('- Lowercase:', /[a-z]/.test(password));
console.log('- Uppercase:', /[A-Z]/.test(password));
console.log('- Digit:', /\d/.test(password));
console.log('- Special char:', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password));
console.log('- Length 6-30:', password.length >= 6 && password.length <= 30); 
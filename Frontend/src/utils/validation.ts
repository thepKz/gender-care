/**
 * Kiểm tra email hợp lệ
 * @param email Email cần kiểm tra
 * @returns true nếu email hợp lệ
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Kiểm tra số điện thoại hợp lệ (Việt Nam)
 * @param phone Số điện thoại cần kiểm tra
 * @returns true nếu số điện thoại hợp lệ
 */
export const isValidPhone = (phone: string): boolean => {
  // Kiểm tra số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
  const phoneRegex = /^(0[3-9][0-9]{8})$/;
  return phoneRegex.test(phone);
};

/**
 * Kiểm tra mật khẩu có đủ mạnh không
 * Yêu cầu ít nhất 8 ký tự, chứa chữ hoa, chữ thường, số và ký tự đặc biệt
 * @param password Mật khẩu cần kiểm tra
 * @returns true nếu mật khẩu đủ mạnh
 */
export const isStrongPassword = (password: string): boolean => {
  if (password.length < 8) {
    return false;
  }

  // Kiểm tra có chữ hoa
  const hasUpperCase = /[A-Z]/.test(password);
  // Kiểm tra có chữ thường
  const hasLowerCase = /[a-z]/.test(password);
  // Kiểm tra có số
  const hasNumber = /[0-9]/.test(password);
  // Kiểm tra có ký tự đặc biệt
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

/**
 * Kiểm tra họ tên hợp lệ
 * @param name Họ tên cần kiểm tra
 * @returns true nếu họ tên hợp lệ
 */
export const isValidName = (name: string): boolean => {
  // Kiểm tra họ tên có ít nhất 2 từ và không chứa ký tự đặc biệt
  const nameRegex = /^[A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s]{1,}$/;
  return nameRegex.test(name) && name.trim().split(/\s+/).length >= 2;
};

/**
 * Kiểm tra URL hợp lệ
 * @param url URL cần kiểm tra
 * @returns true nếu URL hợp lệ
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Kiểm tra thời gian định dạng HH:mm
 * @param time Thời gian cần kiểm tra
 * @returns true nếu thời gian hợp lệ
 */
export const isValidTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Kiểm tra ngày định dạng DD/MM/YYYY
 * @param date Ngày cần kiểm tra
 * @returns true nếu ngày hợp lệ
 */
export const isValidDate = (date: string): boolean => {
  const dateRegex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/;

  if (!dateRegex.test(date)) {
    return false;
  }

  // Kiểm tra ngày tháng có hợp lệ không
  const [day, month, year] = date.split('/').map(Number);
  const d = new Date(year, month - 1, day);

  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
};

// ============= THÊM CÁC HÀM VALIDATION CHO THỜI GIAN HỌC TẬP VÀ KINH NGHIỆM =============

/**
 * Kiểm tra năm có hợp lệ không (là số 4 chữ số và không lớn hơn năm hiện tại + 1)
 * @param year Năm cần kiểm tra (dạng số hoặc chuỗi)
 * @returns true nếu năm hợp lệ
 */
export const isValidYear = (year: string | number): boolean => {
  const currentYear = new Date().getFullYear();

  // Chuyển về số nếu là chuỗi
  const yearNumber = typeof year === 'string' ? parseInt(year, 10) : year;

  // Kiểm tra là số 4 chữ số và không lớn hơn năm hiện tại + 1
  return !isNaN(yearNumber) &&
    yearNumber.toString().length === 4 &&
    yearNumber >= 1900 &&
    yearNumber <= currentYear + 1; // Cho phép năm kết thúc có thể là năm sau
};

/**
 * Chuẩn hóa chuỗi năm (trường hợp năm thiếu số)
 * @param yearStr Chuỗi năm cần chuẩn hóa
 * @returns Năm đã chuẩn hóa hoặc null nếu không thể chuẩn hóa
 */
export const normalizeYear = (yearStr: string): string | null => {
  // Nếu đã là năm hợp lệ, trả về luôn
  if (isValidYear(yearStr)) {
    return yearStr;
  }

  // Trường hợp nhập thiếu chữ số (như 202 thay vì 2002)
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;

  // Xử lý trường hợp nhập 2-3 chữ số
  if (/^\d{2,3}$/.test(yearStr)) {
    // Thêm số 0 ở đầu để thành 4 chữ số
    const paddedYear = yearStr.padStart(4, '0');
    if (isValidYear(paddedYear)) {
      return paddedYear;
    }

    // Thử ghép với thế kỷ hiện tại
    const withCurrentCentury = parseInt(currentCentury.toString().substring(0, 2) + yearStr, 10);
    if (isValidYear(withCurrentCentury)) {
      return withCurrentCentury.toString();
    }
  }

  return null; // Không thể chuẩn hóa
};

/**
 * Kiểm tra và chuẩn hóa cặp năm bắt đầu-kết thúc
 * @param startYear Năm bắt đầu
 * @param endYear Năm kết thúc hoặc "hiện tại"
 * @returns Object chứa năm đã chuẩn hóa và thông báo lỗi (nếu có)
 */
export const validateYearRange = (startYear: string, endYear: string): {
  isValid: boolean,
  normalizedStart?: string,
  normalizedEnd?: string,
  errorMessage?: string
} => {
  // Kiểm tra "hiện tại"
  const isEndYearCurrent = endYear.toLowerCase() === 'hiện tại';

  // Chuẩn hóa năm bắt đầu
  const normalizedStart = normalizeYear(startYear);

  // Chuẩn hóa năm kết thúc (trừ trường hợp "hiện tại")
  const normalizedEnd = isEndYearCurrent ? 'hiện tại' : normalizeYear(endYear);

  // Kiểm tra năm bắt đầu hợp lệ
  if (!normalizedStart) {
    return {
      isValid: false,
      errorMessage: `Năm bắt đầu "${startYear}" không hợp lệ. Vui lòng nhập năm có 4 chữ số.`
    };
  }

  // Kiểm tra năm kết thúc hợp lệ (trừ trường hợp "hiện tại")
  if (!isEndYearCurrent && !normalizedEnd) {
    return {
      isValid: false,
      errorMessage: `Năm kết thúc "${endYear}" không hợp lệ. Vui lòng nhập năm có 4 chữ số hoặc "hiện tại".`
    };
  }

  // Kiểm tra thứ tự năm
  if (!isEndYearCurrent) {
    const startYearNumber = parseInt(normalizedStart, 10);
    const endYearNumber = parseInt(normalizedEnd as string, 10);

    if (startYearNumber > endYearNumber) {
      return {
        isValid: false,
        normalizedStart,
        normalizedEnd,
        errorMessage: `Năm bắt đầu (${normalizedStart}) phải nhỏ hơn năm kết thúc (${normalizedEnd}).`
      };
    }

    // Kiểm tra thời gian hợp lý (không quá dài)
    if (endYearNumber - startYearNumber > 20) {
      return {
        isValid: true, // Vẫn hợp lệ nhưng cảnh báo
        normalizedStart,
        normalizedEnd,
        errorMessage: `Cảnh báo: Khoảng thời gian ${normalizedStart}-${normalizedEnd} (${endYearNumber - startYearNumber} năm) có vẻ khá dài.`
      };
    }
  }

  // Mọi thứ đều hợp lệ
  return {
    isValid: true,
    normalizedStart,
    normalizedEnd
  };
};

/**
 * Xác thực một dòng thông tin học tập hoặc kinh nghiệm
 * Định dạng chuẩn: "YYYY-YYYY: Nội dung" hoặc "YYYY-hiện tại: Nội dung"
 * @param line Dòng cần xác thực
 * @param type Loại thông tin ('education' hoặc 'experience')
 * @returns Kết quả xác thực và dòng đã chuẩn hóa (nếu có thể)
 */
export const validateTimeRangeLine = (line: string, type: 'education' | 'experience'): {
  isValid: boolean,
  normalizedLine?: string,
  errorMessage?: string
} => {
  // Kiểm tra định dạng "YYYY-YYYY: Nội dung" hoặc các biến thể
  // Dấu - có thể là Unicode dash (–) hoặc dấu gạch ngang thông thường (-)
  const timeRangeRegex = /^(\d{1,4})[\-\–](\d{1,4}|hiện tại):\s*(.+)$/i;
  const match = line.match(timeRangeRegex);

  if (!match) {
    return {
      isValid: false,
      errorMessage: `Định dạng không hợp lệ. Vui lòng sử dụng định dạng "YYYY-YYYY: ${type === 'education' ? 'Tên trường' : 'Nơi làm việc'}" hoặc "YYYY-hiện tại: ${type === 'education' ? 'Tên trường' : 'Nơi làm việc'}".`
    };
  }

  const [, startYear, endYear, content] = match;

  // Kiểm tra nội dung không được để trống
  if (!content.trim()) {
    return {
      isValid: false,
      errorMessage: `${type === 'education' ? 'Tên trường' : 'Nơi làm việc'} không được để trống.`
    };
  }

  // Xác thực và chuẩn hóa năm
  const yearValidation = validateYearRange(startYear, endYear);

  if (!yearValidation.isValid) {
    return yearValidation;
  }

  // Tạo dòng đã chuẩn hóa
  const normalizedLine = `${yearValidation.normalizedStart}-${yearValidation.normalizedEnd}: ${content.trim()}`;

  return {
    isValid: true,
    normalizedLine,
    errorMessage: yearValidation.errorMessage // Truyền cảnh báo nếu có
  };
};

/**
 * Xác thực nhiều dòng thông tin học tập hoặc kinh nghiệm
 * @param text Văn bản chứa nhiều dòng cần xác thực
 * @param type Loại thông tin ('education' hoặc 'experience')
 * @returns Kết quả xác thực và văn bản đã chuẩn hóa (nếu có thể)
 */
export const validateTimeRangeText = (text: string, type: 'education' | 'experience'): {
  isValid: boolean,
  normalizedText?: string,
  errorMessages: string[]
} => {
  // Tách các dòng
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const normalizedLines: string[] = [];
  const errorMessages: string[] = [];
  let allValid = true;

  // Xác thực từng dòng
  lines.forEach((line, index) => {
    const validation = validateTimeRangeLine(line, type);

    if (!validation.isValid) {
      allValid = false;
      errorMessages.push(`Dòng ${index + 1}: ${validation.errorMessage}`);
    } else {
      normalizedLines.push(validation.normalizedLine!);

      // Thêm cảnh báo nếu có
      if (validation.errorMessage) {
        errorMessages.push(`Dòng ${index + 1}: ${validation.errorMessage}`);
      }
    }
  });

  // Kiểm tra nếu không có dòng nào
  if (lines.length === 0) {
    return {
      isValid: false,
      errorMessages: [`Vui lòng nhập ít nhất một dòng thông tin ${type === 'education' ? 'học tập' : 'kinh nghiệm'}.`]
    };
  }

  return {
    isValid: allValid,
    normalizedText: allValid ? normalizedLines.join('\n') : undefined,
    errorMessages
  };
}; 
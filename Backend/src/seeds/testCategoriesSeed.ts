import TestCategories from '../models/TestCategories';

const testCategoriesData = [
  {
    name: 'Cholesterol toàn phần',
    description: 'Đo tổng lượng cholesterol trong máu',
    unit: 'mg/dL',
    normalRange: '<200'
  },
  {
    name: 'HDL Cholesterol',
    description: 'Cholesterol lipoprotein mật độ cao (cholesterol tốt)',
    unit: 'mg/dL',
    normalRange: '>40 (nam), >50 (nữ)'
  },
  {
    name: 'LDL Cholesterol',
    description: 'Cholesterol lipoprotein mật độ thấp (cholesterol xấu)',
    unit: 'mg/dL',
    normalRange: '<100'
  },
  {
    name: 'Triglycerides',
    description: 'Triglycerides trong máu',
    unit: 'mg/dL',
    normalRange: '<150'
  },
  {
    name: 'Glucose',
    description: 'Đường huyết lúc đói',
    unit: 'mg/dL',
    normalRange: '70-100'
  },
  {
    name: 'HbA1c',
    description: 'Hemoglobin A1c (đường huyết trung bình 3 tháng)',
    unit: '%',
    normalRange: '<5.7'
  },
  {
    name: 'ALT (SGPT)',
    description: 'Alanine aminotransferase - enzyme gan',
    unit: 'U/L',
    normalRange: '7-56'
  },
  {
    name: 'AST (SGOT)',
    description: 'Aspartate aminotransferase - enzyme gan',
    unit: 'U/L',
    normalRange: '10-40'
  },
  {
    name: 'Creatinine',
    description: 'Creatinine huyết thanh - chức năng thận',
    unit: 'mg/dL',
    normalRange: '0.6-1.2'
  },
  {
    name: 'BUN',
    description: 'Blood Urea Nitrogen - chức năng thận',
    unit: 'mg/dL',
    normalRange: '6-24'
  },
  {
    name: 'TSH',
    description: 'Thyroid Stimulating Hormone - tuyến giáp',
    unit: 'mIU/L',
    normalRange: '0.27-4.20'
  },
  {
    name: 'T3',
    description: 'Triiodothyronine - hormone tuyến giáp',
    unit: 'ng/dL',
    normalRange: '80-200'
  },
  {
    name: 'T4',
    description: 'Thyroxine - hormone tuyến giáp',
    unit: 'μg/dL',
    normalRange: '5.1-14.1'
  },
  {
    name: 'Hemoglobin',
    description: 'Huyết sắc tố',
    unit: 'g/dL',
    normalRange: '12-15.5 (nữ), 13.5-17.5 (nam)'
  },
  {
    name: 'Hematocrit',
    description: 'Tỷ lệ hồng cầu trong máu',
    unit: '%',
    normalRange: '36-46 (nữ), 41-53 (nam)'
  },
  {
    name: 'WBC',
    description: 'Bạch cầu',
    unit: '10³/μL',
    normalRange: '4.5-11.0'
  },
  {
    name: 'Platelet',
    description: 'Tiểu cầu',
    unit: '10³/μL',
    normalRange: '150-450'
  },
  {
    name: 'PSA',
    description: 'Prostate-Specific Antigen - tuyến tiền liệt',
    unit: 'ng/mL',
    normalRange: '<4.0'
  },
  {
    name: 'CA 125',
    description: 'Cancer Antigen 125 - dấu ấn ung thư buồng trứng',
    unit: 'U/mL',
    normalRange: '<35'
  },
  {
    name: 'CEA',
    description: 'Carcinoembryonic Antigen - dấu ấn ung thư',
    unit: 'ng/mL',
    normalRange: '<3.0'
  }
];

const seedTestCategories = async () => {
  try {
    console.log('🧪 Bắt đầu seed Test Categories...');
    
    // Xóa dữ liệu cũ
    await TestCategories.deleteMany({});
    
    // Thêm dữ liệu mới
    const created = await TestCategories.insertMany(testCategoriesData);
    
    console.log(`✅ Đã tạo ${created.length} test categories thành công!`);
    return created;
  } catch (error) {
    console.error('❌ Lỗi khi seed Test Categories:', error);
    throw error;
  }
};

export default seedTestCategories; 
import mongoose from 'mongoose';
import TestCategories from '../models/TestCategories';
import { config } from 'dotenv';

// Load biến môi trường
config();

interface TestCategorySeed {
  name: string;
  description: string;
  unit: string;
  normalRange: string;
}

const testCategoriesData: TestCategorySeed[] = [
  // 1. Blood Sugar Tests
  {
    name: 'Glucose lúc đói',
    description: 'Đo nồng độ đường huyết sau khi nhịn ăn ít nhất 8 giờ',
    unit: 'mg/dL',
    normalRange: '70-100'
  },
  {
    name: 'HbA1c',
    description: 'Đo nồng độ đường huyết trung bình trong 2-3 tháng qua',
    unit: '%',
    normalRange: '4.0-5.6'
  },
  {
    name: 'Glucose sau ăn 2h',
    description: 'Đo nồng độ đường huyết 2 giờ sau khi ăn',
    unit: 'mg/dL',
    normalRange: '<140'
  },

  // 2. Lipid Panel Tests
  {
    name: 'Cholesterol toàn phần',
    description: 'Đo tổng lượng cholesterol trong máu',
    unit: 'mg/dL',
    normalRange: '<200'
  },
  {
    name: 'HDL Cholesterol',
    description: 'Cholesterol tốt - giúp bảo vệ tim mạch',
    unit: 'mg/dL',
    normalRange: '>40 (nam), >50 (nữ)'
  },
  {
    name: 'LDL Cholesterol',
    description: 'Cholesterol xấu - có thể gây tắc nghẽn động mạch',
    unit: 'mg/dL',
    normalRange: '<100'
  },
  {
    name: 'Triglycerides',
    description: 'Chất béo trong máu có thể gây bệnh tim mạch',
    unit: 'mg/dL',
    normalRange: '<150'
  },

  // 3. Liver Function Tests
  {
    name: 'ALT (SGPT)',
    description: 'Enzyme gan - chỉ báo tổn thương tế bào gan',
    unit: 'IU/L',
    normalRange: '7-41'
  },
  {
    name: 'AST (SGOT)',
    description: 'Enzyme gan - chỉ báo tổn thương gan và tim',
    unit: 'IU/L',
    normalRange: '13-35'
  },
  {
    name: 'Bilirubin toàn phần',
    description: 'Sản phẩm phân hủy hồng cầu - chỉ báo chức năng gan',
    unit: 'mg/dL',
    normalRange: '0.2-1.2'
  },

  // 4. Kidney Function Tests
  {
    name: 'Creatinine',
    description: 'Chỉ báo chức năng thận và khối lượng cơ',
    unit: 'mg/dL',
    normalRange: '0.6-1.2 (nam), 0.5-1.1 (nữ)'
  },
  {
    name: 'Urea',
    description: 'Sản phẩm chuyển hóa protein - chỉ báo chức năng thận',
    unit: 'mg/dL',
    normalRange: '7-25'
  },
  {
    name: 'eGFR',
    description: 'Tốc độ lọc cầu thận ước tính',
    unit: 'mL/min/1.73m²',
    normalRange: '>60'
  },

  // 5. Thyroid Function Tests
  {
    name: 'TSH',
    description: 'Hormone kích thích tuyến giáp',
    unit: 'mIU/L',
    normalRange: '0.4-4.0'
  },
  {
    name: 'Free T4',
    description: 'Hormone tuyến giáp tự do',
    unit: 'ng/dL',
    normalRange: '0.8-1.8'
  },
  {
    name: 'Free T3',
    description: 'Hormone tuyến giáp hoạt tính tự do',
    unit: 'pg/mL',
    normalRange: '2.3-4.2'
  },

  // 6. Complete Blood Count
  {
    name: 'Hemoglobin',
    description: 'Protein vận chuyển oxy trong hồng cầu',
    unit: 'g/dL',
    normalRange: '12-15 (nữ), 14-17 (nam)'
  },
  {
    name: 'Hematocrit',
    description: 'Tỷ lệ thể tích hồng cầu trong máu',
    unit: '%',
    normalRange: '36-46 (nữ), 41-50 (nam)'
  },
  {
    name: 'Bạch cầu',
    description: 'Tế bào bạch cầu - chỉ báo nhiễm trùng và miễn dịch',
    unit: 'cells/μL',
    normalRange: '4,000-11,000'
  },
  {
    name: 'Tiểu cầu',
    description: 'Tế bào giúp đông máu',
    unit: 'cells/μL',
    normalRange: '150,000-450,000'
  },

  // 7. Inflammation Markers
  {
    name: 'CRP',
    description: 'Protein phản ứng C - chỉ báo viêm nhiễm',
    unit: 'mg/L',
    normalRange: '<3.0'
  },
  {
    name: 'ESR',
    description: 'Tốc độ lắng hồng cầu - chỉ báo viêm nhiễm',
    unit: 'mm/h',
    normalRange: '<20 (nam), <30 (nữ)'
  },

  // 8. Vitamin & Minerals
  {
    name: 'Vitamin D',
    description: 'Vitamin hỗ trợ hấp thu canxi và sức khỏe xương',
    unit: 'ng/mL',
    normalRange: '30-100'
  },
  {
    name: 'Vitamin B12',
    description: 'Vitamin cần thiết cho hệ thần kinh và tạo máu',
    unit: 'pg/mL',
    normalRange: '300-900'
  },
  {
    name: 'Folate',
    description: 'Vitamin B9 cần thiết cho tạo DNA và hồng cầu',
    unit: 'ng/mL',
    normalRange: '3-17'
  }
];

async function seedTestCategories() {
  try {
    // Kết nối đến MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✅ Connected to MongoDB for Test Categories seeding');

    // Xóa dữ liệu cũ
    await TestCategories.deleteMany({});
    console.log('🧹 Cleared existing test categories');

    // Tạo test categories mới
    const createdCategories = await TestCategories.insertMany(testCategoriesData);
    console.log(`✅ Created ${createdCategories.length} test categories`);

    // Hiển thị thống kê
    const stats = {
      total: createdCategories.length,
      withUnit: createdCategories.filter(cat => cat.unit && cat.unit.trim().length > 0).length,
      withNormalRange: createdCategories.filter(cat => cat.normalRange && cat.normalRange.trim().length > 0).length,
      complete: createdCategories.filter(cat => 
        cat.unit && cat.unit.trim().length > 0 && 
        cat.normalRange && cat.normalRange.trim().length > 0
      ).length
    };

    console.log('\n📊 Test Categories Statistics:');
    console.log(`   🔬 Tổng số loại xét nghiệm: ${stats.total}`);
    console.log(`   📏 Có đơn vị đo: ${stats.withUnit}`);
    console.log(`   📊 Có giá trị chuẩn: ${stats.withNormalRange}`);
    console.log(`   ✅ Thông tin đầy đủ: ${stats.complete}`);

    // Hiển thị một số examples
    console.log('\n🔍 Ví dụ về test categories đã tạo:');
    const examples = createdCategories.slice(0, 5);
    examples.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.unit}) - Bình thường: ${cat.normalRange}`);
    });

    console.log('\n🎉 Test Categories seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding test categories:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Chạy seed nếu file được thực thi trực tiếp
if (require.main === module) {
  seedTestCategories()
    .then(() => {
      console.log('✅ Test Categories seed process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test Categories seed process failed:', error);
      process.exit(1);
    });
}

export { seedTestCategories }; 
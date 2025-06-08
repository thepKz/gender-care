import { Medicines } from '../models';

// Dữ liệu medicines mẫu cho healthcare giới tính
const medicinesData = [
  // Thuốc tránh thai
  {
    name: "Diane-35",
    type: "contraceptive",
    description: "Thuốc tránh thai kết hợp, điều trị mụn trứng cá và hirsutism",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống cùng giờ hàng ngày, tốt nhất vào buổi tối"
  },
  {
    name: "Marvelon",
    type: "contraceptive", 
    description: "Thuốc tránh thai đơn pha, chứa Ethinylestradiol và Desogestrel",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống trong 21 ngày liên tiếp, nghỉ 7 ngày"
  },
  {
    name: "Yasmin",
    type: "contraceptive",
    description: "Thuốc tránh thai chứa Drospirenone, giúp giảm phù nề và tăng cân",
    defaultDosage: "1 viên/ngày", 
    defaultTimingInstructions: "Uống cùng giờ hàng ngày trong 21 ngày"
  },
  {
    name: "Cerelle",
    type: "contraceptive",
    description: "Thuốc tránh thai chỉ chứa progestin, phù hợp cho phụ nữ cho con bú",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống liên tục không nghỉ, cùng giờ hàng ngày"
  },

  // Vitamin và bổ sung
  {
    name: "Acid Folic 5mg",
    type: "vitamin",
    description: "Bổ sung acid folic cho phụ nữ mang thai và chuẩn bị mang thai",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống trước hoặc sau ăn 30 phút"
  },
  {
    name: "Pregnacare Plus",
    type: "vitamin",
    description: "Vitamin tổng hợp cho phụ nữ mang thai, chứa DHA và acid folic",
    defaultDosage: "2 viên/ngày",
    defaultTimingInstructions: "1 viên sáng, 1 viên tối sau ăn"
  },
  {
    name: "Feroglobin B12",
    type: "vitamin",
    description: "Bổ sung sắt và vitamin B12, điều trị thiếu máu",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống sau ăn sáng, tránh uống cùng trà/cà phê"
  },
  {
    name: "Calcium + Vitamin D3",
    type: "vitamin",
    description: "Bổ sung canxi và vitamin D3 cho phụ nữ mãn kinh",
    defaultDosage: "1-2 viên/ngày",
    defaultTimingInstructions: "Uống sau ăn, tách ra thời điểm khác nhau"
  },
  {
    name: "Omega-3 Fish Oil",
    type: "vitamin",
    description: "Bổ sung DHA và EPA, tốt cho tim mạch và não bộ",
    defaultDosage: "1-2 viên/ngày",
    defaultTimingInstructions: "Uống cùng bữa ăn chính"
  },

  // Thuốc điều trị hormone
  {
    name: "Duphaston",
    type: "other",
    description: "Progesterone tổng hợp, điều trị rối loạn kinh nguyệt",
    defaultDosage: "10-20mg/ngày",
    defaultTimingInstructions: "Chia 2-3 lần trong ngày, uống cùng bữa ăn"
  },
  {
    name: "Clomid",
    type: "other", 
    description: "Thuốc kích thích rụng trứng, điều trị vô sinh",
    defaultDosage: "50mg/ngày",
    defaultTimingInstructions: "Uống từ ngày 3-7 của chu kỳ kinh, cùng giờ hàng ngày"
  },
  {
    name: "Metformin",
    type: "other",
    description: "Điều trị hội chứng buồng trứng đa nang (PCOS), tiểu đường thai kỳ",
    defaultDosage: "500-1000mg",
    defaultTimingInstructions: "Uống cùng bữa ăn, bắt đầu với liều thấp"
  },

  // Thuốc kháng sinh phụ khoa
  {
    name: "Fluconazole 150mg",
    type: "antibiotic",
    description: "Điều trị nhiễm nấm âm đạo",
    defaultDosage: "1 viên",
    defaultTimingInstructions: "Uống 1 lần duy nhất, có thể lặp lại sau 3 ngày"
  },
  {
    name: "Metronidazole 500mg",
    type: "antibiotic",
    description: "Điều trị viêm âm đạo do vi khuẩn",
    defaultDosage: "500mg x 2 lần/ngày",
    defaultTimingInstructions: "Uống 2 lần/ngày trong 7 ngày, tránh rượu bia"
  },
  {
    name: "Doxycycline 100mg",
    type: "antibiotic",
    description: "Điều trị nhiễm khuẩn đường tiết niệu và phụ khoa",
    defaultDosage: "100mg x 2 lần/ngày",
    defaultTimingInstructions: "Uống sau ăn, tránh nằm ngay sau khi uống"
  },

  // Thuốc giảm đau
  {
    name: "Ibuprofen 400mg",
    type: "painkiller",
    description: "Giảm đau bụng kinh, đau đầu, kháng viêm",
    defaultDosage: "400mg khi đau",
    defaultTimingInstructions: "Uống khi đau, tối đa 3 lần/ngày, uống sau ăn"
  },
  {
    name: "Paracetamol 500mg",
    type: "painkiller",
    description: "Giảm đau, hạ sốt an toàn cho phụ nữ mang thai",
    defaultDosage: "500mg-1g",
    defaultTimingInstructions: "Uống khi cần, cách nhau ít nhất 4 giờ, tối đa 4g/ngày"
  },
  {
    name: "Spasmaverine",
    type: "painkiller",
    description: "Giảm co thắt cơ trơn, đau bụng kinh",
    defaultDosage: "40mg x 3 lần/ngày",
    defaultTimingInstructions: "Uống trước ăn 30 phút"
  },

  // Thuốc hỗ trợ mãn kinh
  {
    name: "Estriol Cream",
    type: "other",
    description: "Kem estrogen tại chỗ, điều trị khô âm đạo mãn kinh",
    defaultDosage: "1-2g/ngày",
    defaultTimingInstructions: "Bôi vào âm đạo vào buổi tối"
  },
  {
    name: "Black Cohosh Extract",
    type: "other",
    description: "Thảo dược hỗ trợ giảm triệu chứng mãn kinh",
    defaultDosage: "40mg/ngày",
    defaultTimingInstructions: "Uống 1 lần/ngày cùng bữa ăn"
  },

  // Thuốc hỗ trợ thai kỳ
  {
    name: "Esmya",
    type: "other",
    description: "Điều trị u xơ tử cung",
    defaultDosage: "5mg/ngày",
    defaultTimingInstructions: "Uống cùng giờ hàng ngày, có thể uống đói hoặc no"
  },
  {
    name: "Cyclogest Pessaries",
    type: "other",
    description: "Progesterone âm đạo, hỗ trợ giai đoạn hoàng thể",
    defaultDosage: "200-400mg/ngày",
    defaultTimingInstructions: "Đặt âm đạo 1-2 lần/ngày"
  }
];

const seedMedicines = async () => {
  try {
    // Kiểm tra đã có medicines nào chưa
    const existingMedicines = await Medicines.countDocuments();
    if (existingMedicines > 0) {
      console.log('✅ Medicines seed data đã tồn tại, bỏ qua việc tạo mới');
      return;
    }

    console.log('🌱 Đang tạo Medicines seed data...');

    // Thêm dữ liệu mới
    const medicines = await Medicines.insertMany(medicinesData);
    console.log(`✅ Đã thêm ${medicines.length} medicines thành công`);

    console.log('🎉 Hoàn thành seed medicines cho gender healthcare!');
    console.log('\n📋 Danh sách medicines đã được thêm:');
    console.log('   💊 Thuốc tránh thai: Diane-35, Marvelon, Yasmin, Cerelle');
    console.log('   🧴 Vitamin & bổ sung: Acid Folic, Pregnacare Plus, Feroglobin B12');
    console.log('   🏥 Thuốc điều trị: Duphaston, Clomid, Metformin');
    console.log('   💉 Kháng sinh phụ khoa: Fluconazole, Metronidazole, Doxycycline');
    console.log('   💊 Thuốc giảm đau: Ibuprofen, Paracetamol, Spasmaverine');

    return medicines;
  } catch (error) {
    console.error('❌ Lỗi khi seed medicines:', error);
  }
};

export default seedMedicines; 
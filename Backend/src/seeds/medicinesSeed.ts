import Medicines, { IMedicines } from '../models/Medicines';

const medicinesData: Omit<IMedicines, 'createdAt' | 'updatedAt'>[] = [
  // THUỐC TRÁNH THAI (8 loại)
  {
    name: "Diane-35",
    type: "contraceptive",
    description: "Thuốc tránh thai kết hợp, điều trị mụn trứng cá và rậm lông ở phụ nữ",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống cùng giờ mỗi ngày, bắt đầu từ ngày đầu chu kỳ",
    isActive: true
  },
  {
    name: "Mercilon",
    type: "contraceptive",
    description: "Thuốc tránh thai kết hợp liều thấp, ít tác dụng phụ",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống 21 ngày, nghỉ 7 ngày",
    isActive: true
  },
  {
    name: "Yasmin",
    type: "contraceptive", 
    description: "Thuốc tránh thai với tác dụng lợi tiểu nhẹ, kiểm soát cân nặng",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống liên tục 21 ngày, sau đó nghỉ 7 ngày",
    isActive: true
  },
  {
    name: "Postinor-2",
    type: "contraceptive",
    description: "Thuốc tránh thai khẩn cấp trong 72h sau quan hệ",
    defaultDosage: "2 viên",
    defaultTimingInstructions: "Uống viên 1 ngay lập tức, viên 2 sau 12 giờ",
    isActive: true
  },
  {
    name: "Marvelon",
    type: "contraceptive",
    description: "Thuốc tránh thai phù hợp cho phụ nữ trẻ, ít tác dụng phụ",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống 21 ngày liên tục, nghỉ 7 ngày",
    isActive: true
  },
  {
    name: "Cerazette",
    type: "contraceptive",
    description: "Thuốc tránh thai mini-pill không chứa estrogen",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống liên tục không nghỉ, cùng giờ mỗi ngày",
    isActive: true
  },
  {
    name: "Mirena IUD",
    type: "contraceptive",
    description: "Vòng tránh thai có hormone levonorgestrel",
    defaultDosage: "1 vòng/5 năm",
    defaultTimingInstructions: "Đặt trong buồng tử cung bởi bác sĩ",
    isActive: true
  },
  {
    name: "Etonogestrel Implant",
    type: "contraceptive",
    description: "Que cấy tránh thai dưới da",
    defaultDosage: "1 que/3 năm",
    defaultTimingInstructions: "Cấy dưới da cánh tay bởi bác sĩ",
    isActive: true
  },

  // VITAMIN & BỔ SUNG (8 loại)
  {
    name: "Acid Folic 5mg",
    type: "vitamin",
    description: "Vitamin B9 thiết yếu cho phụ nữ mang thai và cho con bú",
    defaultDosage: "5mg/ngày",
    defaultTimingInstructions: "Uống trước ăn sáng hoặc theo chỉ định bác sĩ",
    isActive: true
  },
  {
    name: "Elevit Pronatal",
    type: "vitamin",
    description: "Vitamin tổng hợp cho bà bầu và cho con bú",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống sau ăn sáng với nhiều nước",
    isActive: true
  },
  {
    name: "Vitamin D3 1000IU",
    type: "vitamin",
    description: "Bổ sung vitamin D3 cho sức khỏe xương và hệ miễn dịch",
    defaultDosage: "1000IU/ngày",
    defaultTimingInstructions: "Uống cùng bữa ăn có chất béo",
    isActive: true
  },
  {
    name: "Iron Fumarate 200mg",
    type: "vitamin",
    description: "Bổ sung sắt điều trị và phòng ngừa thiếu máu",
    defaultDosage: "200mg/ngày",
    defaultTimingInstructions: "Uống đói bụng kèm vitamin C, tránh trà cà phê",
    isActive: true
  },
  {
    name: "Calcium + Vitamin D",
    type: "vitamin",
    description: "Bổ sung canxi và vitamin D cho phụ nữ mãn kinh",
    defaultDosage: "600mg canxi + 400IU D3",
    defaultTimingInstructions: "Uống sau ăn tối, chia 2 lần trong ngày",
    isActive: true
  },
  {
    name: "Omega-3 DHA",
    type: "vitamin",
    description: "Acid béo omega-3 cho thai nhi và sức khỏe tim mạch",
    defaultDosage: "1000mg/ngày",
    defaultTimingInstructions: "Uống cùng bữa ăn để tăng hấp thu",
    isActive: true
  },
  {
    name: "Magnesium 400mg",
    type: "vitamin",
    description: "Bổ sung magie giảm căng thẳng và chuột rút",
    defaultDosage: "400mg/ngày",
    defaultTimingInstructions: "Uống trước ngủ để thư giãn",
    isActive: true
  },
  {
    name: "Vitamin B Complex",
    type: "vitamin",
    description: "Phức hợp vitamin B hỗ trợ hệ thần kinh và trao đổi chất",
    defaultDosage: "1 viên/ngày",
    defaultTimingInstructions: "Uống sau ăn sáng",
    isActive: true
  },

  // KHÁNG SINH (8 loại)
  {
    name: "Azithromycin 500mg",
    type: "antibiotic",
    description: "Kháng sinh điều trị nhiễm khuẩn đường sinh dục",
    defaultDosage: "500mg x 1 lần/ngày",
    defaultTimingInstructions: "Uống 1 giờ trước ăn hoặc 2 giờ sau ăn trong 3 ngày",
    isActive: true
  },
  {
    name: "Metronidazole 500mg",
    type: "antibiotic",
    description: "Điều trị viêm âm đạo do vi khuẩn và ký sinh trùng",
    defaultDosage: "500mg x 2 lần/ngày",
    defaultTimingInstructions: "Uống 2 lần/ngày trong 7 ngày, tránh rượu bia",
    isActive: true
  },
  {
    name: "Doxycycline 100mg",
    type: "antibiotic",
    description: "Điều trị nhiễm khuẩn đường tiết niệu và phụ khoa",
    defaultDosage: "100mg x 2 lần/ngày",
    defaultTimingInstructions: "Uống sau ăn, tránh nằm ngay sau khi uống",
    isActive: true
  },
  {
    name: "Cefixime 200mg",
    type: "antibiotic",
    description: "Kháng sinh điều trị nhiễm khuẩn đường tiết niệu",
    defaultDosage: "200mg x 2 lần/ngày",
    defaultTimingInstructions: "Uống sau ăn trong 7-10 ngày",
    isActive: true
  },
  {
    name: "Amoxicillin 500mg",
    type: "antibiotic",
    description: "Kháng sinh an toàn cho phụ nữ mang thai",
    defaultDosage: "500mg x 3 lần/ngày",
    defaultTimingInstructions: "Uống sau ăn trong 7 ngày",
    isActive: true
  },
  {
    name: "Clarithromycin 250mg",
    type: "antibiotic",
    description: "Điều trị nhiễm khuẩn H. pylori và đường hô hấp",
    defaultDosage: "250mg x 2 lần/ngày",
    defaultTimingInstructions: "Uống cùng bữa ăn trong 10-14 ngày",
    isActive: true
  },
  {
    name: "Ciprofloxacin 500mg",
    type: "antibiotic",
    description: "Điều trị nhiễm khuẩn đường tiết niệu phức tạp",
    defaultDosage: "500mg x 2 lần/ngày",
    defaultTimingInstructions: "Uống với nhiều nước, tránh sữa và canxi",
    isActive: true
  },
  {
    name: "Cephalexin 250mg",
    type: "antibiotic",
    description: "Kháng sinh điều trị nhiễm khuẩn da và mô mềm",
    defaultDosage: "250mg x 4 lần/ngày",
    defaultTimingInstructions: "Uống đều các bữa trong ngày",
    isActive: true
  },

  // THUỐC GIẢM ĐAU (8 loại)
  {
    name: "Ibuprofen 400mg",
    type: "painkiller",
    description: "Giảm đau bụng kinh, đau đầu, kháng viêm",
    defaultDosage: "400mg khi đau",
    defaultTimingInstructions: "Uống khi đau, tối đa 3 lần/ngày, uống sau ăn",
    isActive: true
  },
  {
    name: "Paracetamol 500mg",
    type: "painkiller",
    description: "Giảm đau, hạ sốt an toàn cho phụ nữ mang thai",
    defaultDosage: "500mg-1g",
    defaultTimingInstructions: "Uống khi cần, cách nhau ít nhất 4 giờ, tối đa 4g/ngày",
    isActive: true
  },
  {
    name: "Spasmaverine 40mg",
    type: "painkiller",
    description: "Giảm co thắt cơ trơn, đau bụng kinh",
    defaultDosage: "40mg x 3 lần/ngày",
    defaultTimingInstructions: "Uống trước ăn 30 phút",
    isActive: true
  },
  {
    name: "Naproxen 250mg",
    type: "painkiller",
    description: "Thuốc chống viêm giảm đau hiệu quả cao",
    defaultDosage: "250mg x 2 lần/ngày",
    defaultTimingInstructions: "Uống sau ăn, tối đa 10 ngày",
    isActive: true
  },
  {
    name: "Mefenamic Acid 250mg",
    type: "painkiller",
    description: "Giảm đau bụng kinh và chảy máu nhiều",
    defaultDosage: "250mg x 3 lần/ngày",
    defaultTimingInstructions: "Uống sau ăn trong 3-7 ngày",
    isActive: true
  },
  {
    name: "Aspirin 81mg",
    type: "painkiller",
    description: "Liều thấp phòng ngừa tiền sản giật",
    defaultDosage: "81mg/ngày",
    defaultTimingInstructions: "Uống buổi tối từ tuần 12 thai kỳ",
    isActive: true
  },
  {
    name: "Diclofenac 25mg",
    type: "painkiller",
    description: "Giảm đau và viêm hiệu quả",
    defaultDosage: "25mg x 3 lần/ngày",
    defaultTimingInstructions: "Uống sau ăn, tối đa 5 ngày",
    isActive: true
  },
  {
    name: "Ketorolac 10mg",
    type: "painkiller",
    description: "Giảm đau mạnh sau phẫu thuật",
    defaultDosage: "10mg x 3 lần/ngày",
    defaultTimingInstructions: "Uống sau ăn, tối đa 5 ngày",
    isActive: true
  },

  // THUỐC KHÁC (8 loại)
  {
    name: "Estriol Cream",
    type: "other",
    description: "Kem estrogen tại chỗ, điều trị khô âm đạo mãn kinh",
    defaultDosage: "1-2g/ngày",
    defaultTimingInstructions: "Bôi vào âm đạo vào buổi tối",
    isActive: true
  },
  {
    name: "Black Cohosh Extract",
    type: "other",
    description: "Thảo dược hỗ trợ giảm triệu chứng mãn kinh",
    defaultDosage: "40mg/ngày",
    defaultTimingInstructions: "Uống 1 lần/ngày cùng bữa ăn",
    isActive: true
  },
  {
    name: "Fluconazole 150mg",
    type: "other",
    description: "Thuốc kháng nấm điều trị nhiễm Candida âm đạo",
    defaultDosage: "150mg x 1 viên",
    defaultTimingInstructions: "Uống 1 viên duy nhất, có thể lặp lại sau 3 ngày nếu cần",
    isActive: true
  },
  {
    name: "Clotrimazole Cream",
    type: "other",
    description: "Kem kháng nấm điều trị nhiễm nấm âm đạo",
    defaultDosage: "1 ống/ngày",
    defaultTimingInstructions: "Đưa sâu vào âm đạo trước khi ngủ trong 6 ngày",
    isActive: true
  },
  {
    name: "Lactulose Syrup",
    type: "other",
    description: "Thuốc nhuận tràng an toàn cho thai phụ",
    defaultDosage: "15ml x 2 lần/ngày",
    defaultTimingInstructions: "Uống sau ăn sáng và tối",
    isActive: true
  },
  {
    name: "Simethicone 40mg",
    type: "other",
    description: "Thuốc giảm đầy hơi, khó tiêu",
    defaultDosage: "40mg x 3 lần/ngày",
    defaultTimingInstructions: "Uống sau ăn và trước ngủ",
    isActive: true
  },
  {
    name: "Misoprostol 200mcg",
    type: "other",
    description: "Thuốc làm mềm cổ tử cung và co tử cung",
    defaultDosage: "200mcg theo chỉ định",
    defaultTimingInstructions: "Chỉ sử dụng theo chỉ định nghiêm ngặt của bác sĩ",
    isActive: true
  },
  {
    name: "Progesterone 200mg",
    type: "other",
    description: "Hormone progesterone hỗ trợ thai kỳ",
    defaultDosage: "200mg/ngày",
    defaultTimingInstructions: "Đặt âm đạo hoặc uống theo chỉ định bác sĩ",
    isActive: true
  }
];

const seedMedicines = async () => {
  try {
    console.log('🌱 Bắt đầu seed dữ liệu thuốc...');

    // Xóa dữ liệu cũ
    await Medicines.deleteMany({});
    console.log('✅ Đã xóa dữ liệu thuốc cũ');

    // Thêm dữ liệu mới
    const medicines = await Medicines.insertMany(medicinesData);
    console.log(`✅ Đã thêm ${medicines.length} loại thuốc thành công:`);
    
    // Thống kê theo loại
    const stats = {
      contraceptive: medicines.filter(m => m.type === 'contraceptive').length,
      vitamin: medicines.filter(m => m.type === 'vitamin').length,
      antibiotic: medicines.filter(m => m.type === 'antibiotic').length,
      painkiller: medicines.filter(m => m.type === 'painkiller').length,
      other: medicines.filter(m => m.type === 'other').length
    };
    
    console.log('📊 Thống kê theo loại thuốc:');
    console.log(`   - Thuốc tránh thai: ${stats.contraceptive} loại`);
    console.log(`   - Vitamin & bổ sung: ${stats.vitamin} loại`);
    console.log(`   - Kháng sinh: ${stats.antibiotic} loại`);
    console.log(`   - Thuốc giảm đau: ${stats.painkiller} loại`);
    console.log(`   - Thuốc khác: ${stats.other} loại`);
    
    return medicines;
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu thuốc:', error);
    throw error;
  }
};

export default seedMedicines; 
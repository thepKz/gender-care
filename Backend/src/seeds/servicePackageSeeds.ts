import Service from '../models/Service';
import ServicePackages from '../models/ServicePackages';
import mongoose from 'mongoose';

// Định nghĩa các gói dịch vụ với logic bundling
const packageTemplates = [
  {
    name: 'Gói Tư vấn Cơ bản',
    description: 'Gói tư vấn sức khỏe sinh sản cơ bản với bác sĩ chuyên khoa',
    serviceTypes: ['consultation'],
    serviceNames: ['Tư vấn sức khỏe sinh sản'],
    discountPercent: 0, // Không giảm giá cho single service
    durationInDays: 30,
    maxUsages: 2,
    maxProfiles: [1],
    isMultiProfile: false
  },
  {
    name: 'Gói Xét nghiệm STI Cơ bản',
    description: 'Gói xét nghiệm cơ bản các bệnh lây truyền qua đường tình dục',
    serviceTypes: ['test'],
    serviceNames: ['Xét nghiệm STI/STD cơ bản'],
    discountPercent: 0,
    durationInDays: 60,
    maxUsages: 1,
    maxProfiles: [1],
    isMultiProfile: false
  },
  {
    name: 'Gói Chăm sóc Tâm lý',
    description: 'Gói tư vấn tâm lý tình dục và theo dõi chu kỳ kinh nguyệt',
    serviceTypes: ['consultation'],
    serviceNames: ['Tư vấn tâm lý tình dục', 'Theo dõi chu kỳ kinh nguyệt'],
    discountPercent: 15,
    durationInDays: 90,
    maxUsages: 5,
    maxProfiles: [1],
    isMultiProfile: false
  },
  {
    name: 'Gói Tư vấn Premium',
    description: 'Gói tư vấn toàn diện bao gồm sức khỏe sinh sản và tâm lý',
    serviceTypes: ['consultation'],
    serviceNames: ['Tư vấn sức khỏe sinh sản', 'Tư vấn tâm lý tình dục', 'Theo dõi chu kỳ kinh nguyệt'],
    discountPercent: 20,
    durationInDays: 120,
    maxUsages: 8,
    maxProfiles: [1, 2],
    isMultiProfile: true
  },
  {
    name: 'Gói Kiểm tra Sức khỏe Toàn diện',
    description: 'Gói bao gồm khám tổng quát và xét nghiệm STI toàn diện',
    serviceTypes: ['test'],
    serviceNames: ['Khám sức khỏe tổng quát', 'Xét nghiệm STI/STD toàn diện'],
    discountPercent: 18,
    durationInDays: 180,
    maxUsages: 2,
    maxProfiles: [1],
    isMultiProfile: false
  },
  {
    name: 'Gói Gia đình Standard',
    description: 'Gói dành cho cặp đôi bao gồm tư vấn và xét nghiệm cơ bản',
    serviceTypes: ['consultation', 'test'],
    serviceNames: ['Tư vấn sức khỏe sinh sản', 'Xét nghiệm STI/STD cơ bản', 'Tư vấn tâm lý tình dục'],
    discountPercent: 25,
    durationInDays: 180,
    maxUsages: 6,
    maxProfiles: [2],
    isMultiProfile: true
  },
  {
    name: 'Gói VIP - Chăm sóc Cao cấp',
    description: 'Gói VIP bao gồm tất cả dịch vụ với số lượt sử dụng không giới hạn',
    serviceTypes: ['consultation', 'test'],
    serviceNames: [], // Sẽ include tất cả services
    discountPercent: 30,
    durationInDays: 365,
    maxUsages: 20,
    maxProfiles: [1, 2, 4],
    isMultiProfile: true
  },
  {
    name: 'Gói Sinh viên',
    description: 'Gói ưu đãi dành cho sinh viên với giá cả phải chăng',
    serviceTypes: ['consultation'],
    serviceNames: ['Tư vấn sức khỏe sinh sản', 'Tư vấn tâm lý tình dục'],
    discountPercent: 35,
    durationInDays: 90,
    maxUsages: 4,
    maxProfiles: [1],
    isMultiProfile: false
  }
];

// Hàm tính giá gói dựa trên services
const calculatePackagePrice = (services: any[], discountPercent: number) => {
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
  const discountedPrice = totalPrice * (1 - discountPercent / 100);
  
  return {
    priceBeforeDiscount: totalPrice,
    price: Math.round(discountedPrice / 1000) * 1000 // Làm tròn đến nghìn
  };
};

export const seedServicePackages = async () => {
  try {
    console.log('🌱 Đang tạo Service Package seed data...');

    // Kiểm tra đã có package nào chưa
    const existingPackages = await ServicePackages.countDocuments();
    if (existingPackages > 0) {
      console.log('✅ Service Package seed data đã tồn tại, bỏ qua việc tạo mới');
      return;
    }

    // Lấy tất cả services hiện có
    const allServices = await Service.find({ isDeleted: { $ne: 1 } });
    
    if (allServices.length === 0) {
      throw new Error('❌ Không tìm thấy service nào. Vui lòng chạy servicesSeed trước!');
    }

    console.log(`📋 Tìm thấy ${allServices.length} services, đang tạo ${packageTemplates.length} gói dịch vụ...`);

    // Tạo từng package
    const packagePromises = packageTemplates.map(async (template) => {
      let selectedServices;

      // Logic chọn services cho package
      if (template.serviceNames.length === 0) {
        // VIP package - include tất cả services
        selectedServices = allServices;
      } else {
        // Chọn services theo tên cụ thể
        selectedServices = allServices.filter(service => 
          template.serviceNames.includes(service.serviceName)
        );
      }

      // Fallback nếu không tìm thấy services theo tên
      if (selectedServices.length === 0) {
        selectedServices = allServices.filter(service => 
          template.serviceTypes.includes(service.serviceType)
        );
      }

      // Nếu vẫn không có services, skip package này
      if (selectedServices.length === 0) {
        console.log(`   ⚠️ Bỏ qua gói "${template.name}" - không tìm thấy services phù hợp`);
        return null;
      }

      // Tính giá package
      const pricing = calculatePackagePrice(selectedServices, template.discountPercent);

      // Tạo package data
      const packageData = {
        name: template.name,
        description: template.description,
        priceBeforeDiscount: pricing.priceBeforeDiscount,
        price: pricing.price,
        serviceIds: selectedServices.map(service => service._id),
        isActive: true,
        durationInDays: template.durationInDays,
        maxUsages: template.maxUsages,
        maxProfiles: template.maxProfiles,
        isMultiProfile: template.isMultiProfile
      };

      // Tạo package trong database
      const createdPackage = await ServicePackages.create(packageData);

      // Log thông tin package đã tạo
      const discountAmount = pricing.priceBeforeDiscount - pricing.price;
      console.log(`   ✅ ${template.name}`);
      console.log(`      - Services: ${selectedServices.length} dịch vụ`);
      console.log(`      - Giá gốc: ${pricing.priceBeforeDiscount.toLocaleString('vi-VN')}đ`);
      console.log(`      - Giá bán: ${pricing.price.toLocaleString('vi-VN')}đ (tiết kiệm ${discountAmount.toLocaleString('vi-VN')}đ)`);
      console.log(`      - Thời hạn: ${template.durationInDays} ngày, Tối đa: ${template.maxUsages} lượt`);

      return createdPackage;
    });

    // Thực hiện tạo tất cả packages (filter null values)
    const createdPackages = (await Promise.all(packagePromises)).filter(pkg => pkg !== null);

    // Thống kê kết quả
    const totalSavings = createdPackages.reduce((total, pkg) => {
      return total + (pkg!.priceBeforeDiscount - pkg!.price);
    }, 0);

    console.log('\n🎉 Hoàn thành tạo Service Package seed data!');
    console.log(`📊 Thống kê:`);
    console.log(`   - Số gói đã tạo: ${createdPackages.length}/${packageTemplates.length}`);
    console.log(`   - Tổng tiết kiệm cho khách hàng: ${totalSavings.toLocaleString('vi-VN')}đ`);
    console.log(`   - Gói rẻ nhất: ${Math.min(...createdPackages.map(p => p!.price)).toLocaleString('vi-VN')}đ`);
    console.log(`   - Gói đắt nhất: ${Math.max(...createdPackages.map(p => p!.price)).toLocaleString('vi-VN')}đ`);

    return createdPackages;

  } catch (error) {
    console.error('❌ Lỗi khi tạo service package seeds:', error);
    throw error;
  }
};

export default seedServicePackages; 
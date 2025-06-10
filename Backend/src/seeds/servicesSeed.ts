import Service from '../models/Service';

const servicesData = [
    {
        serviceName: 'Tư vấn sức khỏe sinh sản',
        price: 500000,
        description: 'Tư vấn chuyên sâu với bác sĩ chuyên khoa về sức khỏe sinh sản và tình dục',
        serviceType: 'consultation',
        availableAt: ['Online', 'Center', 'Athome']
    },
    {
        serviceName: 'Xét nghiệm STI/STD cơ bản',
        price: 800000,
        description: 'Gói xét nghiệm cơ bản các bệnh lây truyền qua đường tình dục',
        serviceType: 'test',
        availableAt: ['Center', 'Athome']
    },
    {
        serviceName: 'Xét nghiệm STI/STD toàn diện',
        price: 1200000,
        description: 'Gói xét nghiệm toàn diện các bệnh lây truyền qua đường tình dục',
        serviceType: 'test',
        availableAt: ['Center', 'Athome']
    },
    {
        serviceName: 'Khám sức khỏe tổng quát',
        price: 800000,
        description: 'Khám sức khỏe định kỳ và tư vấn chăm sóc sức khỏe toàn diện',
        serviceType: 'test',
        availableAt: ['Center', 'Athome']
    },
    {
        serviceName: 'Tư vấn tâm lý tình dục',
        price: 400000,
        description: 'Tư vấn và hỗ trợ tâm lý về các vấn đề liên quan đến tình dục',
        serviceType: 'consultation',
        availableAt: ['Online', 'Center']
    },
    {
        serviceName: 'Theo dõi chu kỳ kinh nguyệt',
        price: 300000,
        description: 'Tư vấn và hướng dẫn theo dõi chu kỳ kinh nguyệt hiệu quả',
        serviceType: 'consultation',
        availableAt: ['Online', 'Center', 'Athome']
    }
];

export const seedServices = async () => {
    try {
        console.log('🌱 Seeding services...');

        // Xóa services cũ (soft delete)
        await Service.updateMany({}, { isDeleted: 1 });

        // Tạo services mới
        const services = await Service.create(servicesData);

        console.log(`✅ Successfully seeded ${services.length} services:`);
        services.forEach(service => {
            console.log(`   - ${service.serviceName} (${service.serviceType})`);
        });

        return services;
    } catch (error) {
        console.error('❌ Error seeding services:', error);
        throw error;
    }
};

export default seedServices; 
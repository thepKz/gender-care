import Service from '../models/Service';

const servicesData = [
    {
        serviceName: 'Khám sức khỏe định kỳ nam khoa',
        price: 500000,
        description: 'Khám nam khoa định kỳ, tầm soát ung thư tiền liệt tuyến và các bệnh lý nam khoa',
        serviceType: 'consultation',
        availableAt: ['Center']
    },
    {
        serviceName: 'Khám sức khỏe định kỳ phụ khoa',
        price: 450000,
        description: 'Khám phụ khoa định kỳ, tầm soát ung thư cổ tử cung và các bệnh lý phụ khoa',
        serviceType: 'consultation',
        availableAt: ['Center']
    },
    {
        serviceName: 'Xét nghiệm STIs',
        price: 800000,
        description: 'Xét nghiệm tầm soát các bệnh lây truyền qua đường tình dục (STIs) cơ bản',
        serviceType: 'test',
        availableAt: ['Center']
    },
    {
        serviceName: 'Xét nghiệm STDi',
        price: 1200000,
        description: 'Xét nghiệm tầm soát bệnh lây truyền qua đường tình dục nâng cao (STDi), bao gồm HIV, Hepatitis B, C',
        serviceType: 'test',
        availableAt: ['Center']
    },
    {
        serviceName: 'Tư vấn online (Google Meet)',
        price: 300000,
        description: 'Tư vấn sức khỏe sinh sản và kế hoạch hóa gia đình qua Google Meet',
        serviceType: 'consultation',
        availableAt: ['Online']
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
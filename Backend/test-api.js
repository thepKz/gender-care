const fetch = require('node-fetch');

async function testAPI() {
    try {
        console.log('🧪 Testing API endpoints...\n');
        
        // Test basic doctors endpoint
        console.log('1. Testing GET /api/doctors');
        const basicResponse = await fetch('http://localhost:5000/api/doctors');
        if (basicResponse.ok) {
            const basicData = await basicResponse.json();
            console.log('✅ Basic doctors endpoint works:', basicData.length, 'doctors found\n');
        } else {
            console.log('❌ Basic doctors endpoint failed:', basicResponse.status, basicResponse.statusText, '\n');
        }
        
        // Test enhanced doctors endpoint
        console.log('2. Testing GET /api/doctors/details/all');
        const enhancedResponse = await fetch('http://localhost:5000/api/doctors/details/all');
        if (enhancedResponse.ok) {
            const enhancedData = await enhancedResponse.json();
            console.log('✅ Enhanced doctors endpoint works:', enhancedData.total, 'doctors found');
            
            // Show first doctor details
            if (enhancedData.data && enhancedData.data[0]) {
                const firstDoctor = enhancedData.data[0];
                console.log('📋 First doctor details:');
                console.log('   - Name:', firstDoctor.userId?.fullName);
                console.log('   - Status:', firstDoctor.status?.statusText);
                console.log('   - IsActive:', firstDoctor.status?.isActive);
                console.log('   - Feedback count:', firstDoctor.feedback?.totalCount || 0);
            }
        } else {
            console.log('❌ Enhanced doctors endpoint failed:', enhancedResponse.status, enhancedResponse.statusText);
            const errorText = await enhancedResponse.text();
            console.log('   Error details:', errorText);
        }
        
    } catch (error) {
        console.error('🚨 Test failed:', error.message);
    }
}

testAPI(); 
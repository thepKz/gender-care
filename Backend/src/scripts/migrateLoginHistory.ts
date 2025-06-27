import mongoose from 'mongoose';
import LoginHistory from '../models/LoginHistory';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration script để update existing LoginHistory records
 * - Thêm field logoutAt cho các records cũ
 * - Estimate logout time cho các session cũ (optional)
 */
const migrateLoginHistory = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gender-healthcare');
    console.log('✅ Connected to MongoDB');

    // Đếm số records cần migrate
    const recordsToMigrate = await LoginHistory.countDocuments({ logoutAt: { $exists: false } });
    console.log(`📊 Found ${recordsToMigrate} records to migrate`);

    if (recordsToMigrate === 0) {
      console.log('✅ No records need migration. All records already have logoutAt field.');
      return;
    }

    // Update existing records để thêm field logoutAt = null và location
    const result = await LoginHistory.updateMany(
      { 
        $or: [
          { logoutAt: { $exists: false } },
          { location: { $exists: false } }
        ]
      },
      { 
        $set: { 
          logoutAt: null,
          location: 'Unknown Location' 
        } 
      }
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`📝 Modified ${result.modifiedCount} records`);
    console.log(`📝 Matched ${result.matchedCount} records`);

    // Optional: Estimate logout time cho các session quá cũ (hơn 7 ngày)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldSessions = await LoginHistory.updateMany(
      { 
        loginAt: { $lt: sevenDaysAgo },
        logoutAt: null,
        status: 'success'
      },
      { 
        $set: { 
          logoutAt: new Date(sevenDaysAgo) // Estimate logout time
        } 
      }
    );

    console.log(`📝 Estimated logout time for ${oldSessions.modifiedCount} old sessions`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Chạy migration nếu file được execute trực tiếp
if (require.main === module) {
  migrateLoginHistory();
}

export default migrateLoginHistory; 
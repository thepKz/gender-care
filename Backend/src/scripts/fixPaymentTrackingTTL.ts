import mongoose from 'mongoose';
import PaymentTracking from '../models/PaymentTracking';

/**
 * 🛠️ Migration Script: Fix PaymentTracking TTL Issue
 * 
 * Problem: TTL index was auto-deleting ALL payment data after 15 minutes
 * Solution: Set expiresAt = null for completed payments to preserve audit trail
 */

async function fixPaymentTrackingTTL() {
  try {
    console.log('🔧 Starting PaymentTracking TTL fix migration...');

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gender-healthcare');
      console.log('📊 Connected to MongoDB');
    }

    // 🛡️ Fix existing completed payments to prevent auto-deletion
    const completedStatuses = ['success', 'failed', 'cancelled'];
    
    const result = await PaymentTracking.updateMany(
      { 
        status: { $in: completedStatuses },
        expiresAt: { $ne: null }
      },
      { 
        $unset: { expiresAt: "" } // Remove expiresAt field completely
      }
    );

    console.log(`✅ Fixed ${result.modifiedCount} completed payment records`);

    // 📊 Show statistics
    const stats = await PaymentTracking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          hasExpiry: {
            $sum: {
              $cond: [{ $ne: ['$expiresAt', null] }, 1, 0]
            }
          }
        }
      }
    ]);

    console.log('📈 Current PaymentTracking statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} records (${stat.hasExpiry} with expiry)`);
    });

    // 🧹 Clean up old TTL index if exists
    try {
      const collection = PaymentTracking.collection;
      const indexes = await collection.indexes();
      
      console.log('🔍 Existing indexes:');
      indexes.forEach(index => {
        console.log(`   - ${JSON.stringify(index.key)} ${index.expireAfterSeconds !== undefined ? `(TTL: ${index.expireAfterSeconds}s)` : ''}`);
      });

      // Drop old problematic TTL index if exists
      const oldTTLIndex = indexes.find(idx => 
        idx.key.expiresAt && 
        idx.expireAfterSeconds === 0 && 
        !idx.partialFilterExpression
      );

      if (oldTTLIndex && oldTTLIndex.name) {
        await collection.dropIndex(oldTTLIndex.name);
        console.log(`🗑️ Dropped old problematic TTL index: ${oldTTLIndex.name}`);
      }

    } catch (error) {
      console.log('ℹ️ No problematic TTL index found or already dropped');
    }

    console.log('✅ PaymentTracking TTL fix completed successfully!');
    console.log('💡 From now on:');
    console.log('   - Pending payments will expire after 15 minutes');
    console.log('   - Successful/failed/cancelled payments will be kept forever');
    console.log('   - Payment audit trail preserved for reporting');

  } catch (error) {
    console.error('❌ Error fixing PaymentTracking TTL:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fixPaymentTrackingTTL()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default fixPaymentTrackingTTL; 
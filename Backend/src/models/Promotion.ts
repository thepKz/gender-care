import mongoose, { Schema } from "mongoose";

export interface IPromotion {
  code: string;
  discount: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

const promotionSchema = new Schema<IPromotion>(
  {
    code: { 
      type: String, 
      required: true,
      unique: true,
      uppercase: true
    },
    discount: { 
      type: Number, 
      required: true,
      min: 0
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// Validate that endDate is after startDate
promotionSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    const error = new Error('End date must be after start date');
    return next(error);
  }
  next();
});

// Method để kiểm tra xem khuyến mãi có hợp lệ vào thời điểm hiện tại không
promotionSchema.methods.isValid = function(): boolean {
  const now = new Date();
  return this.startDate <= now && now <= this.endDate;
};

const Promotion = mongoose.model<IPromotion>("Promotion", promotionSchema);

export default Promotion; 
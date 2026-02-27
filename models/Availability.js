import mongoose from 'mongoose';

const AvailabilitySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true }, 
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

AvailabilitySchema.index({ userId: 1, date: 1 });

export default mongoose.models.Availability || mongoose.model('Availability', AvailabilitySchema);

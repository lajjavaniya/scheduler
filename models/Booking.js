import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  linkId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  date: { type: String, required: true }, 
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }, 
  visitorName: { type: String, default: 'Anonymous' },
  visitorEmail: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

BookingSchema.index({ linkId: 1, date: 1, startTime: 1 }, { unique: true });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

import mongoose from 'mongoose';

const BookingLinkSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  linkId: { type: String, required: true, unique: true, index: true },
  slotDurationMinutes: { type: Number, default: 30 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.BookingLink || mongoose.model('BookingLink', BookingLinkSchema);

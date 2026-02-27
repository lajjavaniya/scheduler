import connectDB from '../../../lib/db';
import Booking from '../../../models/Booking';
import BookingLink from '../../../models/BookingLink';
import Availability from '../../../models/Availability';

function generateSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + durationMinutes <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    const nextMin = current + durationMinutes;
    const nh = Math.floor(nextMin / 60).toString().padStart(2, '0');
    const nm = (nextMin % 60).toString().padStart(2, '0');
    slots.push({ startTime: `${h}:${m}`, endTime: `${nh}:${nm}` });
    current += durationMinutes;
  }
  return slots;
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');
    const date = searchParams.get('date');

    if (!linkId) {
      return Response.json({ error: 'linkId required' }, { status: 400 });
    }

    const link = await BookingLink.findOne({ linkId });
    if (!link) {
      return Response.json({ error: 'Booking link not found' }, { status: 404 });
    }

    if (date) {
      const availability = await Availability.findOne({ userId: link.userId, date });
      if (!availability) {
        return Response.json({ slots: [], availableDates: [] });
      }

      const allSlots = generateSlots(availability.startTime, availability.endTime, link.slotDurationMinutes);

      const booked = await Booking.find({ linkId, date });
      const bookedTimes = new Set(booked.map(b => b.startTime));

      const availableSlots = allSlots.filter(s => !bookedTimes.has(s.startTime));
      return Response.json({ slots: availableSlots });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const availabilities = await Availability.find({
        userId: link.userId,
        date: { $gte: today }
      }).sort({ date: 1 });

      const availableDates = availabilities.map(a => a.date);
      return Response.json({ availableDates });
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { linkId, date, startTime, endTime, visitorName, visitorEmail } = body;

    if (!linkId || !date || !startTime || !endTime) {
      return Response.json({ error: 'linkId, date, startTime and endTime are required' }, { status: 400 });
    }

    const link = await BookingLink.findOne({ linkId });
    if (!link) {
      return Response.json({ error: 'Booking link not found' }, { status: 404 });
    }

    const existing = await Booking.findOne({ linkId, date, startTime });
    if (existing) {
      return Response.json({ error: 'This slot has already been booked' }, { status: 409 });
    }

    const availability = await Availability.findOne({ userId: link.userId, date });
    if (!availability) {
      return Response.json({ error: 'No availability for this date' }, { status: 400 });
    }

    if (startTime < availability.startTime || endTime > availability.endTime) {
      return Response.json({ error: 'Slot outside available hours' }, { status: 400 });
    }

    const booking = await Booking.create({
      linkId,
      userId: link.userId,
      date,
      startTime,
      endTime,
      visitorName: visitorName || 'Anonymous',
      visitorEmail: visitorEmail || '',
    });

    return Response.json({ success: true, booking }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return Response.json({ error: 'Slot already booked' }, { status: 409 });
    }
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

import connectDB from '../../../lib/db';
import Availability from '../../../models/Availability';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, date, startTime, endTime } = body;

    if (!userId || !date || !startTime || !endTime) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (startTime >= endTime) {
      return Response.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    const existing = await Availability.findOne({ userId, date });
    if (existing) {
      existing.startTime = startTime;
      existing.endTime = endTime;
      await existing.save();
      return Response.json({ success: true, availability: existing }, { status: 200 });
    }

    const availability = await Availability.create({ userId, date, startTime, endTime });
    return Response.json({ success: true, availability }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    const slots = await Availability.find({ userId }).sort({ date: 1 });
    return Response.json({ slots });
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

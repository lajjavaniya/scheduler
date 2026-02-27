import connectDB from '../../../lib/db';
import BookingLink from '../../../models/BookingLink';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, slotDurationMinutes = 30 } = body;

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    const linkId = uuidv4();
    const bookingLink = await BookingLink.create({ userId, linkId, slotDurationMinutes });

    return Response.json({ success: true, linkId, bookingLink }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return Response.json({ error: 'linkId required' }, { status: 400 });
    }

    const link = await BookingLink.findOne({ linkId });
    if (!link) {
      return Response.json({ error: 'Link not found' }, { status: 404 });
    }

    return Response.json({ link });
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

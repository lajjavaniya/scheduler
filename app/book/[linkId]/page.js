'use client';
import { useState, useEffect, use } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function BookingCalendar({ availableDates, selectedDate, onSelect }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const availableSet = new Set(availableDates);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = today.toISOString().split('T')[0];

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="btn-outline px-3 py-1 text-sm">‹</button>
        <span className="font-semibold">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={next} className="btn-outline px-3 py-1 text-sm">›</button>
      </div>
      <div className="calendar-grid mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold py-1" style={{color: 'var(--muted)'}}>{d}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} className="cal-day empty" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isPast = dateStr < todayStr;
          const isAvailable = availableSet.has(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          return (
            <div
              key={day}
              className={`cal-day ${isPast || !isAvailable ? 'past' : ''} ${isAvailable && !isPast ? 'available' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => isAvailable && !isPast && onSelect(dateStr)}
            >
              {day}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 12, textAlign: 'center' }}>
        Highlighted dates have availability
      </p>
    </div>
  );
}

export default function BookingPage({ params }) {
  const { linkId } = params;
  const [linkValid, setLinkValid] = useState(null); // null=loading, false=invalid, true=valid
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`/api/bookings?linkId=${linkId}`);
        if (res.status === 404) { setLinkValid(false); return; }
        const data = await res.json();
        setAvailableDates(data.availableDates || []);
        setLinkValid(true);
      } catch {
        setLinkValid(false);
      }
    }
    init();
  }, [linkId]);

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setError('');
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings?linkId=${linkId}&date=${date}`);
      const data = await res.json();
      setSlots(data.slots || []);
      setStep(2);
    } catch {
      setError('Failed to load slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!visitorName.trim()) return setError('Please enter your name');
    setError('');
    setBooking(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          visitorName: visitorName.trim(),
          visitorEmail: visitorEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setBooked(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBooking(false);
    }
  };

  if (linkValid === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (linkValid === false) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>404</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            This booking link doesn't exist or hasn't been generated yet.
          </p>
        </div>
      </div>
    );
  }

  if (booked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 48 }}>
          <h1  style={{ fontSize: '1.8rem', marginBottom: 12 }}>Booking Confirmed!</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
            Your appointment has been scheduled for:
          </p>
          
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <span className="font-display" style={{ fontSize: '1.5rem', color: 'var(--accent-light)' }}>Scheduler</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 12 }}>Book a Time</span>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
       

        <div style={{ display: 'grid', gridTemplateColumns: step >= 2 ? '1fr 1fr' : '1fr', gap: 24, maxWidth: step >= 2 ? '100%' : 500 }}>
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>
              {availableDates.length === 0 ? '😔 No availability yet' : 'Choose a date'}
            </h2>
            {availableDates.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>The host hasn't added any availability yet.</p>
            ) : (
              <BookingCalendar
                availableDates={availableDates}
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
              />
            )}
          </div>

          {step >= 2 && (
            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>
                Available Times
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 20 }}>{formatDate(selectedDate)}</p>

              {loadingSlots ? (
                <p style={{ color: 'var(--muted)' }}>Loading slots…</p>
              ) : slots.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No available slots for this date. Try another day.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                    {slots.map((slot) => (
                      <button
                        key={slot.startTime}
                        className={`slot-chip ${selectedSlot?.startTime === slot.startTime ? 'selected' : ''}`}
                        onClick={() => { setSelectedSlot(slot); setStep(3); setError(''); }}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    ))}
                  </div>

                  {step >= 3 && selectedSlot && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>
                        Booking {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                      </h3>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Your Name *</label>
                        <input
                          type="text"
                          placeholder="Jane Smith"
                          value={visitorName}
                          onChange={e => setVisitorName(e.target.value)}
                        />
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Email (optional)</label>
                        <input
                          type="email"
                          placeholder="jane@example.com"
                          value={visitorEmail}
                          onChange={e => setVisitorEmail(e.target.value)}
                        />
                      </div>
                      {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginBottom: 12 }}>{error}</p>}
                      <button
                        className="btn-primary"
                        onClick={handleBook}
                        disabled={booking}
                        style={{ width: '100%' }}
                      >
                        {booking ? 'Booking…' : '✓ Confirm Booking'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

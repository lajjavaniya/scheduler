'use client';
import { useState, useCallback } from 'react';

const SESSION_USER_ID = typeof window !== 'undefined'
  ? (sessionStorage.getItem('userId') || (() => {
      const id = 'user_' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('userId', id);
      return id;
    })())
  : 'user_demo';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function MiniCalendar({ selectedDate, onSelect }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const todayStr = today.toISOString().split('T')[0];

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
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          return (
            <div
              key={day}
              className={`cal-day ${isPast ? 'past' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => !isPast && onSelect(dateStr)}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slots, setSlots] = useState([]); // In-memory, not persisted across refresh
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [slotDuration, setSlotDuration] = useState(30);

  const handleSave = async () => {
    setError('');
    if (!selectedDate) return setError('Please select a date');
    if (!startTime || !endTime) return setError('Please set start and end times');
    if (startTime >= endTime) return setError('End time must be after start time');

    setSaving(true);
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: SESSION_USER_ID, date: selectedDate, startTime, endTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setSlots(prev => {
        const filtered = prev.filter(s => s.date !== selectedDate);
        return [...filtered, data.availability].sort((a, b) => a.date.localeCompare(b.date));
      });
      setSelectedDate('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    setError('');
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: SESSION_USER_ID, slotDurationMinutes: slotDuration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate link');
      const url = `${window.location.origin}/book/${data.linkId}`;
      setGeneratedLink(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopyMsg('Copied!');
    setTimeout(() => setCopyMsg(''), 2000);
  };

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className="font-display" style={{ fontSize: '1.5rem', color: 'var(--accent-light)' }}>Scheduler</span>
          </div>
          
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
                Add Availability
              </h2>
              
              <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />

              {selectedDate && (
                <div style={{ marginTop: 20, padding: 16, background: 'rgba(108,99,255,0.08)', borderRadius: 12, border: '1px solid rgba(108,99,255,0.2)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent-light)', marginBottom: 12, fontWeight: 600 }}>
                    Set hours for {formatDate(selectedDate)}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Start Time</label>
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>End Time</label>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                    </div>
                  </div>
                  {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginBottom: 12 }}>{error}</p>}
                  <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
                    {saving ? 'Saving…' : '✓ Save Availability'}
                  </button>
                </div>
              )}
            </div>

            {/* Generate Link */}
            <div className="card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>🔗 Booking Link</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Slot Duration</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[15, 30, 45, 60].map(d => (
                    <button
                      key={d}
                      onClick={() => setSlotDuration(d)}
                      className={`slot-chip ${slotDuration === d ? 'selected' : ''}`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={handleGenerateLink}
                disabled={generatingLink}
                style={{ width: '100%', marginBottom: generatedLink ? 16 : 0 }}
              >
                {generatingLink ? 'Generating…' : 'Generate Booking Link'}
              </button>

              {generatedLink && (
                <div style={{ padding: 14, background: 'rgba(108,99,255,0.08)', borderRadius: 10, border: '1px solid rgba(108,99,255,0.2)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8 }}>Share this link with clients:</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <code style={{ fontSize: '0.75rem', color: 'var(--accent-light)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {generatedLink}
                    </code>
                    <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem', flexShrink: 0 }} onClick={copyLink}>
                      {copyMsg || 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>📋 Saved Availability</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 20 }}>Session only — refreshing the page will clear this list.</p>

              {slots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗓️</div>
                  <p style={{ fontSize: '0.9rem' }}>No availability added yet.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Select a date on the calendar to get started.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {slots.map((slot) => (
                    <div key={slot._id || slot.date} style={{
                      padding: '14px 18px',
                      background: 'rgba(108,99,255,0.06)',
                      borderRadius: 12,
                      border: '1px solid rgba(108,99,255,0.15)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatDate(slot.date)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                          {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(108,99,255,0.2)',
                        color: 'var(--accent-light)',
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontWeight: 600,
                      }}>
                        Available Slot
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

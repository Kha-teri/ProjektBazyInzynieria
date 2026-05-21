import { useState, useEffect, type FormEvent } from 'react';
import { getSchedules, createSchedule, deleteSchedule, type ClassSchedule } from '../api/schedules';
import { getSubjects, type Subject } from '../api/subjects';
import styles from './Calendar.module.scss';

const DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const MONTHS = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
];

function extractTime(t: string): string {
  if (!t) return '';
  if (t.includes('T')) return t.split('T')[1].substring(0, 5);
  return t.substring(0, 5);
}

function toDateString(d: string): string {
  return d.split('T')[0];
}

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getSchedules(), getSubjects()])
      .then(([s, sub]) => { setSchedules(s); setSubjects(sub); })
      .catch(() => {});
  }, []);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayRaw = new Date(year, month, 1).getDay();
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1; // Monday-first

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const daySchedules = (dayStr: string) =>
    schedules.filter(s => toDateString(s.date) === dayStr);

  const handleDayClick = (dayStr: string) => {
    setSelectedDay(prev => prev === dayStr ? null : dayStr);
    setDate(dayStr);
    setShowForm(false);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!date) { setFormError('Wybierz datę.'); return; }
    if (!startTime) { setFormError('Podaj godzinę rozpoczęcia.'); return; }
    if (!endTime) { setFormError('Podaj godzinę zakończenia.'); return; }
    if (endTime <= startTime) { setFormError('Godzina końca musi być późniejsza niż początku.'); return; }

    setSubmitting(true);
    try {
      const entry = await createSchedule({
        date,
        start_time: startTime,
        end_time: endTime,
        subject_id: subjectId ? Number(subjectId) : undefined,
      });
      setSchedules(prev => [...prev, entry]);
      setStartTime(''); setEndTime(''); setSubjectId('');
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Błąd podczas dodawania.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch { /* silent */ }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Kalendarz</h1>
        <p className={styles.subtitle}>Harmonogram zajęć i ważnych terminów</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.calendarWrap}>
          <div className={styles.calNav}>
            <button className={styles.navBtn} onClick={prevMonth}>←</button>
            <span className={styles.monthLabel}>{MONTHS[month]} {year}</span>
            <button className={styles.navBtn} onClick={nextMonth}>→</button>
          </div>

          <div className={styles.dayHeaders}>
            {DAYS.map(d => <div key={d} className={styles.dayHeader}>{d}</div>)}
          </div>

          <div className={styles.grid}>
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className={styles.emptyCell} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayScheds = daySchedules(dayStr);
              const isToday = dayStr === now.toISOString().split('T')[0];
              const isSelected = selectedDay === dayStr;
              return (
                <div
                  key={day}
                  className={`${styles.cell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleDayClick(dayStr)}
                >
                  <span className={styles.dayNum}>{day}</span>
                  {dayScheds.length > 0 && (
                    <div className={styles.dots}>
                      {dayScheds.slice(0, 3).map(s => (
                        <span
                          key={s.id}
                          className={styles.dot}
                          style={{ background: s.subject?.color_code ?? 'var(--accent)' }}
                        />
                      ))}
                      {dayScheds.length > 3 && <span className={styles.moreDots}>+{dayScheds.length - 3}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.sidebar}>
          {selectedDay ? (
            <>
              <div className={styles.dayTitle}>
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pl-PL', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })}
              </div>

              <button
                className={styles.addEntryBtn}
                onClick={() => setShowForm(v => !v)}
              >
                {showForm ? '✕ Zamknij' : '+ Dodaj zajęcia'}
              </button>

              {showForm && (
                <form className={styles.form} onSubmit={handleAdd} noValidate>
                  <div className={styles.field}>
                    <label className={styles.label}>Przedmiot</label>
                    <select className={styles.input} value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                      <option value="">— Brak —</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.timeRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Od</label>
                      <input className={styles.input} type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Do</label>
                      <input className={styles.input} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                    </div>
                  </div>
                  {formError && <div className={styles.error}>{formError}</div>}
                  <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    {submitting ? 'Zapisywanie...' : 'Zapisz'}
                  </button>
                </form>
              )}

              <div className={styles.scheduleList}>
                {daySchedules(selectedDay).length === 0 ? (
                  <div className={styles.emptyDay}>Brak zajęć w tym dniu</div>
                ) : (
                  daySchedules(selectedDay)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map(s => (
                      <div key={s.id} className={styles.scheduleEntry}>
                        <div
                          className={styles.entryBar}
                          style={{ background: s.subject?.color_code ?? 'var(--accent)' }}
                        />
                        <div className={styles.entryInfo}>
                          <div className={styles.entryName}>{s.subject?.name ?? 'Zajęcia'}</div>
                          <div className={styles.entryTime}>
                            {extractTime(s.start_time)} – {extractTime(s.end_time)}
                          </div>
                        </div>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>✕</button>
                      </div>
                    ))
                )}
              </div>
            </>
          ) : (
            <div className={styles.noDay}>
              <p>Kliknij dzień na kalendarzu, aby zobaczyć lub dodać zajęcia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

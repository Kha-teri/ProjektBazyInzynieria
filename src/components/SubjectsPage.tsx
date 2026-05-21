import { useState, useEffect, type FormEvent } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject, type Subject } from '../api/subjects';
import styles from './SubjectsPage.module.scss';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSubjects()
      .then(setSubjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setName(''); setLecturer(''); setColor(COLORS[0]);
    setFormError(''); setEditingId(null); setShowForm(false);
  };

  const startEdit = (s: Subject) => {
    setName(s.name);
    setLecturer(s.lecturer_name ?? '');
    setColor(s.color_code ?? COLORS[0]);
    setEditingId(s.id);
    setShowForm(true);
    setFormError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) { setFormError('Nazwa przedmiotu jest wymagana.'); return; }

    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        lecturer_name: lecturer.trim() || undefined,
        color_code: color,
      };

      if (editingId !== null) {
        const updated = await updateSubject(editingId, data);
        setSubjects(prev => prev.map(s => s.id === editingId ? updated : s));
      } else {
        const created = await createSubject(data);
        setSubjects(prev => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Błąd podczas zapisywania.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      if (editingId === id) resetForm();
    } catch { /* silent */ }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Przedmioty</h1>
          <p className={styles.subtitle}>Informacje o przedmiotach i prowadzących</p>
        </div>
        <button className={styles.addBtn} onClick={() => { resetForm(); setShowForm(v => !v); }}>
          {showForm && editingId === null ? '✕ Zamknij' : '+ Dodaj przedmiot'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>{editingId ? 'Edytuj przedmiot' : 'Nowy przedmiot'}</h2>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Nazwa przedmiotu *</label>
                <input
                  className={styles.input}
                  placeholder="np. Bazy Danych"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Prowadzący</label>
                <input
                  className={styles.input}
                  placeholder="Imię i nazwisko"
                  value={lecturer}
                  onChange={e => setLecturer(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Kolor</label>
              <div className={styles.colorPicker}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.colorDot} ${color === c ? styles.selectedColor : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            {formError && <div className={styles.error}>{formError}</div>}
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={resetForm}>Anuluj</button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Zapisywanie...' : editingId ? 'Zapisz zmiany' : 'Dodaj przedmiot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Ładowanie...</div>
      ) : subjects.length === 0 ? (
        <div className={styles.empty}>Brak przedmiotów. Dodaj pierwszy!</div>
      ) : (
        <div className={styles.grid}>
          {subjects.map(s => (
            <div key={s.id} className={styles.card}>
              <div className={styles.cardStripe} style={{ background: s.color_code ?? 'var(--accent)' }} />
              <div className={styles.cardBody}>
                <div className={styles.subjectName}>{s.name}</div>
                {s.lecturer_name && (
                  <div className={styles.lecturerName}>
                    <span className={styles.lecturerIcon}>◉</span>
                    {s.lecturer_name}
                  </div>
                )}
              </div>
              <div className={styles.cardActions}>
                <button className={styles.editBtn} onClick={() => startEdit(s)}>✎ Edytuj</button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

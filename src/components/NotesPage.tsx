import { useState, useEffect, type FormEvent } from 'react';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial, type Material } from '../api/materials';
import { getSubjects, type Subject } from '../api/subjects';
import styles from './NotesPage.module.scss';

export default function NotesPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState('all');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [m, s] = await Promise.all([getMaterials(), getSubjects()]);
      setMaterials(m);
      setSubjects(s);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle(''); setContent(''); setSubjectId('');
    setFormError(''); setEditingId(null); setShowForm(false);
  };

  const startEdit = (m: Material) => {
    setTitle(m.title);
    setContent(m.content ?? '');
    setSubjectId(m.subject_id ? String(m.subject_id) : '');
    setEditingId(m.id);
    setShowForm(true);
    setFormError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) { setFormError('Tytuł jest wymagany.'); return; }

    setSubmitting(true);
    try {
      const data = {
        title: title.trim(),
        type: 'note',
        content: content.trim() || undefined,
        subject_id: subjectId ? Number(subjectId) : undefined,
      };

      if (editingId !== null) {
        const updated = await updateMaterial(editingId, data);
        setMaterials(prev => prev.map(m => m.id === editingId ? updated : m));
      } else {
        const created = await createMaterial(data);
        setMaterials(prev => [created, ...prev]);
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
      await deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
      if (editingId === id) resetForm();
    } catch { /* silent */ }
  };

  const filtered = filterSubject === 'all'
    ? materials
    : materials.filter(m => String(m.subject_id) === filterSubject);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notatki</h1>
          <p className={styles.subtitle}>Przechowuj i organizuj materiały do nauki</p>
        </div>
        <button className={styles.addBtn} onClick={() => { resetForm(); setShowForm(v => !v); }}>
          {showForm && editingId === null ? '✕ Zamknij' : '+ Nowa notatka'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>{editingId ? 'Edytuj notatkę' : 'Nowa notatka'}</h2>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Tytuł *</label>
                <input
                  className={styles.input}
                  placeholder="Tytuł notatki"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Przedmiot</label>
                <select className={styles.input} value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                  <option value="">— Brak —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Treść</label>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Treść notatki..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={8}
              />
            </div>
            {formError && <div className={styles.error}>{formError}</div>}
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={resetForm}>Anuluj</button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Zapisywanie...' : editingId ? 'Zapisz zmiany' : 'Dodaj notatkę'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filterSubject === 'all' ? styles.active : ''}`}
          onClick={() => setFilterSubject('all')}
        >
          Wszystkie <span className={styles.count}>{materials.length}</span>
        </button>
        {subjects
          .filter(s => materials.some(m => m.subject_id === s.id))
          .map(s => (
            <button
              key={s.id}
              className={`${styles.filterBtn} ${filterSubject === String(s.id) ? styles.active : ''}`}
              onClick={() => setFilterSubject(String(s.id))}
              style={{ '--dot': s.color_code ?? 'var(--accent)' } as React.CSSProperties}
            >
              {s.name} <span className={styles.count}>{materials.filter(m => m.subject_id === s.id).length}</span>
            </button>
          ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Ładowanie...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Brak notatek. Dodaj pierwszą!</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(m => (
            <div key={m.id} className={styles.noteCard}>
              <div className={styles.cardHeader}>
                <div className={styles.noteTitle}>{m.title}</div>
                <div className={styles.cardActions}>
                  <button className={styles.editBtn} onClick={() => startEdit(m)}>✎</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(m.id)}>✕</button>
                </div>
              </div>
              {m.subject && (
                <span
                  className={styles.subjectTag}
                  style={{ borderColor: m.subject ? '#6366f1' : 'var(--border)' }}
                >
                  {m.subject.name}
                </span>
              )}
              {m.content && (
                <div className={styles.noteContent}>{m.content}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

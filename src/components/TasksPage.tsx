import { useState, useEffect, type FormEvent } from 'react';
import { getTasks, createTask, updateTaskStatus, deleteTask, type Task } from '../api/tasks';
import { getSubjects, type Subject } from '../api/subjects';
import styles from './TasksPage.module.scss';

const STATUS_LABELS: Record<string, string> = {
  todo: 'Nowe',
  in_progress: 'W trakcie',
  done: 'Ukończone',
};

const STATUS_NEXT: Record<string, string> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [t, s] = await Promise.all([getTasks(), getSubjects()]);
      setTasks(t);
      setSubjects(s);
    } catch {
      setError('Nie udało się załadować zadań.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) { setFormError('Tytuł jest wymagany.'); return; }

    setSubmitting(true);
    try {
      const task = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        subject_id: subjectId ? Number(subjectId) : undefined,
      });
      setTasks(prev => [task, ...prev]);
      setTitle(''); setDescription(''); setDueDate(''); setSubjectId('');
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Błąd podczas dodawania.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (task: Task) => {
    const next = STATUS_NEXT[task.status] ?? 'todo';
    try {
      const updated = await updateTaskStatus(task.id, next);
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch { /* silent */ }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch { /* silent */ }
  };

  const filtered = filterStatus === 'all'
    ? tasks
    : tasks.filter(t => t.status === filterStatus);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Zadania</h1>
          <p className={styles.subtitle}>Zarządzaj swoimi obowiązkami akademickimi</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Zamknij' : '+ Dodaj zadanie'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Nowe zadanie</h2>
          <form className={styles.form} onSubmit={handleAdd} noValidate>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Tytuł *</label>
                <input
                  className={styles.input}
                  placeholder="Nazwa zadania"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Termin</label>
                <input
                  className={styles.input}
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
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
              <label className={styles.label}>Opis</label>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Opcjonalny opis zadania..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            {formError && <div className={styles.error}>{formError}</div>}
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                Anuluj
              </button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Zapisywanie...' : 'Dodaj zadanie'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.filters}>
        {['all', 'todo', 'in_progress', 'done'].map(s => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filterStatus === s ? styles.active : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === 'all' ? 'Wszystkie' : STATUS_LABELS[s]}
            <span className={styles.count}>
              {s === 'all' ? tasks.length : tasks.filter(t => t.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Ładowanie...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          {filterStatus === 'all' ? 'Brak zadań. Dodaj pierwsze!' : 'Brak zadań w tej kategorii.'}
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(task => (
            <div key={task.id} className={`${styles.taskCard} ${styles[task.status]}`}>
              <button
                className={`${styles.statusBtn} ${styles[task.status]}`}
                onClick={() => handleStatus(task)}
                title="Zmień status"
              >
                {task.status === 'done' ? '✓' : task.status === 'in_progress' ? '◑' : '○'}
              </button>

              <div className={styles.taskBody}>
                <div className={`${styles.taskTitle} ${task.status === 'done' ? styles.strikethrough : ''}`}>
                  {task.title}
                </div>
                {task.description && (
                  <div className={styles.taskDesc}>{task.description}</div>
                )}
                <div className={styles.taskMeta}>
                  {task.subject && (
                    <span
                      className={styles.subjectTag}
                      style={{ borderColor: task.subject.color_code ?? 'var(--accent)' }}
                    >
                      {task.subject.name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className={`${styles.dueTag} ${new Date(task.due_date) < new Date() && task.status !== 'done' ? styles.overdue : ''}`}>
                      {new Date(task.due_date).toLocaleDateString('pl-PL')}
                    </span>
                  )}
                  <span className={`${styles.statusBadge} ${styles[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              </div>

              <button className={styles.deleteBtn} onClick={() => handleDelete(task.id)} title="Usuń">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

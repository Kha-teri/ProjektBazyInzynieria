import { useState, useEffect } from 'react';
import { getTasks, updateTaskStatus, deleteTask, type Task } from '../api/tasks';
import styles from './Kanban.module.scss';

const COLUMNS = [
  { id: 'todo', label: 'Do zrobienia', color: 'var(--accent)' },
  { id: 'in_progress', label: 'W trakcie', color: '#f59e0b' },
  { id: 'done', label: 'Ukończone', color: 'var(--glow)' },
];

export default function Kanban() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMove = async (task: Task, newStatus: string) => {
    if (task.status === newStatus) return;
    try {
      const updated = await updateTaskStatus(task.id, newStatus);
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch { /* silent */ }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch { /* silent */ }
  };

  const handleDragStart = (id: number) => setDragging(id);
  const handleDragEnd = () => setDragging(null);

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragging === null) return;
    const task = tasks.find(t => t.id === dragging);
    if (task) await handleMove(task, colId);
    setDragging(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Kanban</h1>
        <p className={styles.subtitle}>Przeciągnij zadania między kolumnami lub użyj przycisków</p>
      </div>

      {loading ? (
        <div className={styles.loading}>Ładowanie...</div>
      ) : (
        <div className={styles.board}>
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className={styles.column}
                onDrop={e => handleDrop(e, col.id)}
                onDragOver={handleDragOver}
              >
                <div className={styles.colHeader}>
                  <span className={styles.colDot} style={{ background: col.color }} />
                  <span className={styles.colLabel}>{col.label}</span>
                  <span className={styles.colCount}>{colTasks.length}</span>
                </div>

                <div className={styles.cards}>
                  {colTasks.length === 0 && (
                    <div className={styles.emptyCol}>Brak zadań</div>
                  )}
                  {colTasks.map(task => (
                    <div
                      key={task.id}
                      className={`${styles.card} ${dragging === task.id ? styles.dragging : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className={styles.cardTitle}>{task.title}</div>
                      {task.description && (
                        <div className={styles.cardDesc}>{task.description}</div>
                      )}
                      <div className={styles.cardMeta}>
                        {task.subject && (
                          <span
                            className={styles.subjectTag}
                            style={{ borderColor: task.subject.color_code ?? col.color }}
                          >
                            {task.subject.name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className={styles.dueTag}>
                            {new Date(task.due_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <div className={styles.cardActions}>
                        {COLUMNS.filter(c => c.id !== col.id).map(target => (
                          <button
                            key={target.id}
                            className={styles.moveBtn}
                            style={{ '--btn-color': target.color } as React.CSSProperties}
                            onClick={() => handleMove(task, target.id)}
                          >
                            → {target.label}
                          </button>
                        ))}
                        <button className={styles.deleteBtn} onClick={() => handleDelete(task.id)}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

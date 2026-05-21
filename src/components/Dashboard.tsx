import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTasks, type Task } from '../api/tasks';
import { getSchedules, type ClassSchedule } from '../api/schedules';
import { getSessions, type StudySession } from '../api/sessions';
import { getProfile } from '../api/user';
import styles from './Dashboard.module.scss';

function formatTime(isoStr: string): string {
  if (!isoStr) return '';
  if (isoStr.includes('T')) return isoStr.split('T')[1].substring(0, 5);
  return isoStr.substring(0, 5);
}

function sessionDuration(s: StudySession): string {
  if (!s.end_time) return 'W trakcie';
  const ms = new Date(s.end_time).getTime() - new Date(s.start_time).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTasks(), getSchedules(), getSessions(), getProfile()])
      .then(([t, s, sess, profile]) => {
        setTasks(t);
        setSchedules(s);
        setSessions(sess);
        updateUser({ points: profile.total_points, level: profile.level });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules
    .filter(s => s.date.startsWith(today))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  const overdue = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
  ).length;
  const activeSession = sessions.find(s => !s.end_time);
  const totalStudyMin = sessions
    .filter(s => s.end_time)
    .reduce((acc, s) => {
      const ms = new Date(s.end_time!).getTime() - new Date(s.start_time).getTime();
      return acc + Math.floor(ms / 60000);
    }, 0);

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'Dzień dobry' : greetHour < 18 ? 'Cześć' : 'Dobry wieczór';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>{greeting}, {user?.email?.split('@')[0]}!</h1>
          <p className={styles.date}>{new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        {activeSession && (
          <div className={styles.sessionBadge}>
            <span className={styles.sessionDot} />
            Sesja nauki aktywna
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Ładowanie...</div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: 'var(--glow)' }}>{user?.points ?? 0}</div>
              <div className={styles.statLabel}>Punkty</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: 'var(--accent)' }}>{user?.level ?? 1}</div>
              <div className={styles.statLabel}>Poziom</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: 'var(--glow)' }}>{doneTasks}</div>
              <div className={styles.statLabel}>Ukończone zadania</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: pendingTasks > 0 ? 'var(--accent)' : 'var(--glow)' }}>{pendingTasks}</div>
              <div className={styles.statLabel}>Zadania do zrobienia</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: overdue > 0 ? '#ef4444' : 'var(--glow)' }}>{overdue}</div>
              <div className={styles.statLabel}>Przeterminowane</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: 'var(--accent)' }}>
                {totalStudyMin < 60 ? `${totalStudyMin}m` : `${Math.floor(totalStudyMin / 60)}h`}
              </div>
              <div className={styles.statLabel}>Czas nauki</div>
            </div>
          </div>

          <div className={styles.columns}>
            <div className={styles.column}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Zajęcia dzisiaj</h2>
                <Link to="/calendar" className={styles.sectionLink}>Wszystkie →</Link>
              </div>
              {todaySchedules.length === 0 ? (
                <div className={styles.empty}>Brak zajęć dzisiaj</div>
              ) : (
                <div className={styles.scheduleList}>
                  {todaySchedules.map(s => (
                    <div key={s.id} className={styles.scheduleCard}>
                      <div
                        className={styles.scheduleColor}
                        style={{ background: s.subject?.color_code ?? 'var(--accent)' }}
                      />
                      <div className={styles.scheduleInfo}>
                        <div className={styles.scheduleName}>{s.subject?.name ?? 'Zajęcia'}</div>
                        <div className={styles.scheduleTime}>
                          {formatTime(s.start_time)} – {formatTime(s.end_time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.column}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Ostatnie zadania</h2>
                <Link to="/tasks" className={styles.sectionLink}>Wszystkie →</Link>
              </div>
              {tasks.length === 0 ? (
                <div className={styles.empty}>Brak zadań</div>
              ) : (
                <div className={styles.taskList}>
                  {tasks.slice(0, 5).map(t => (
                    <div key={t.id} className={styles.taskRow}>
                      <span className={`${styles.taskStatus} ${styles[t.status]}`}>
                        {t.status === 'done' ? '✓' : t.status === 'in_progress' ? '◑' : '○'}
                      </span>
                      <span className={`${styles.taskTitle} ${t.status === 'done' ? styles.done : ''}`}>
                        {t.title}
                      </span>
                      {t.due_date && (
                        <span className={styles.taskDue}>
                          {new Date(t.due_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.column}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Sesje nauki</h2>
                <Link to="/stats" className={styles.sectionLink}>Wszystkie →</Link>
              </div>
              {sessions.length === 0 ? (
                <div className={styles.empty}>Brak sesji nauki</div>
              ) : (
                <div className={styles.sessionList}>
                  {sessions.slice(0, 4).map(s => (
                    <div key={s.id} className={styles.sessionRow}>
                      <div className={styles.sessionTime}>
                        {new Date(s.start_time).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className={styles.sessionDuration}>{sessionDuration(s)}</div>
                      <div className={styles.sessionPoints}>+{s.reward_points} pkt</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

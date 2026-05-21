import { useState, useEffect, useRef } from 'react';
import { getSessions, startSession, stopSession, type StudySession } from '../api/sessions';
import { getTasks } from '../api/tasks';
import { getProfile } from '../api/user';
import { useAuth } from '../context/AuthContext';
import styles from './StatsPage.module.scss';

function duration(s: StudySession): number {
  if (!s.end_time) return 0;
  return Math.floor((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000);
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

export default function StatsPage() {
  const { updateUser } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, done: 0, pending: 0 });
  const [profile, setProfile] = useState<{ total_points: number; level: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const [sess, tasks, prof] = await Promise.all([getSessions(), getTasks(), getProfile()]);
      setSessions(sess);
      setTaskStats({
        total: tasks.length,
        done: tasks.filter(t => t.status === 'done').length,
        pending: tasks.filter(t => t.status !== 'done').length,
      });
      setProfile(prof);
      updateUser({ points: prof.total_points, level: prof.level });
      const active = sess.find(s => !s.end_time);
      setActiveSession(active ?? null);
      if (active) {
        const sec = Math.floor((Date.now() - new Date(active.start_time).getTime()) / 1000);
        setElapsed(sec);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSession]);

  const handleStart = async () => {
    try {
      const s = await startSession();
      setActiveSession(s);
      setSessions(prev => [s, ...prev]);
    } catch { /* silent */ }
  };

  const handleStop = async () => {
    if (!activeSession) return;
    try {
      const updated = await stopSession(activeSession.id);
      setActiveSession(null);
      setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
      const prof = await getProfile();
      setProfile(prof);
      updateUser({ points: prof.total_points, level: prof.level });
    } catch { /* silent */ }
  };

  const totalMin = sessions.filter(s => s.end_time).reduce((acc, s) => acc + duration(s), 0);

  const elapsedStr = (() => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Statystyki</h1>
        <p className={styles.subtitle}>Monitoruj swój postęp i czas nauki</p>
      </div>

      <div className={styles.sessionControl}>
        {activeSession ? (
          <div className={styles.activeSession}>
            <div className={styles.activeDot} />
            <div className={styles.sessionInfo}>
              <div className={styles.sessionLabel}>Sesja nauki aktywna</div>
              <div className={styles.sessionTimer}>{elapsedStr}</div>
            </div>
            <button className={styles.stopBtn} onClick={handleStop}>Zakończ sesję</button>
          </div>
        ) : (
          <div className={styles.startWrap}>
            <div className={styles.startInfo}>
              <div className={styles.startTitle}>Zacznij sesję nauki</div>
              <div className={styles.startSub}>Śledź czas nauki i zdobywaj punkty</div>
            </div>
            <button className={styles.startBtn} onClick={handleStart}>▶ Rozpocznij</button>
          </div>
        )}
      </div>

      {!loading && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: 'var(--glow)' }}>{formatDuration(totalMin)}</div>
              <div className={styles.statLabel}>Łączny czas nauki</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: 'var(--accent)' }}>{sessions.filter(s => s.end_time).length}</div>
              <div className={styles.statLabel}>Ukończone sesje</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: 'var(--glow)' }}>{taskStats.done}</div>
              <div className={styles.statLabel}>Ukończone zadania</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: 'var(--accent)' }}>{taskStats.pending}</div>
              <div className={styles.statLabel}>Zadania w toku</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: 'var(--glow)' }}>{profile?.total_points ?? 0}</div>
              <div className={styles.statLabel}>Łączne punkty</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: 'var(--accent)' }}>{profile?.level ?? 1}</div>
              <div className={styles.statLabel}>Poziom</div>
            </div>
          </div>

          {taskStats.total > 0 && (
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Postęp zadań</span>
                <span className={styles.progressPct}>
                  {Math.round((taskStats.done / taskStats.total) * 100)}%
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(taskStats.done / taskStats.total) * 100}%` }}
                />
              </div>
              <div className={styles.progressInfo}>
                {taskStats.done} / {taskStats.total} ukończone
              </div>
            </div>
          )}

          <div className={styles.sessionsSection}>
            <h2 className={styles.sectionTitle}>Historia sesji</h2>
            {sessions.length === 0 ? (
              <div className={styles.empty}>Brak sesji nauki. Rozpocznij pierwszą!</div>
            ) : (
              <div className={styles.sessionTable}>
                <div className={styles.tableHeader}>
                  <span>Data</span>
                  <span>Godzina start</span>
                  <span>Czas trwania</span>
                  <span>Punkty</span>
                  <span>Status</span>
                </div>
                {sessions.map(s => (
                  <div key={s.id} className={styles.tableRow}>
                    <span>{new Date(s.start_time).toLocaleDateString('pl-PL')}</span>
                    <span>{new Date(s.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{s.end_time ? formatDuration(duration(s)) : elapsedStr}</span>
                    <span className={styles.pointsCol}>+{s.reward_points}</span>
                    <span className={s.end_time ? styles.statusDone : styles.statusActive}>
                      {s.end_time ? 'Ukończona' : '● Aktywna'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.scss';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/tasks', label: 'Zadania', icon: '☑' },
  { to: '/kanban', label: 'Kanban', icon: '▦' },
  { to: '/calendar', label: 'Kalendarz', icon: '◫' },
  { to: '/notes', label: 'Notatki', icon: '✎' },
  { to: '/subjects', label: 'Przedmioty', icon: '◉' },
  { to: '/languages', label: 'Języki', icon: '◎' },
  { to: '/stats', label: 'Statystyki', icon: '▲' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const levelProgress = ((user?.points ?? 0) % 100);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoAccent}>Brain</span>Shelf
      </div>

      <nav className={styles.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.userSection}>
        <div className={styles.levelBar}>
          <div className={styles.levelHeader}>
            <span className={styles.levelLabel}>Poziom {user?.level ?? 1}</span>
            <span className={styles.pointsLabel}>{user?.points ?? 0} pkt</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${levelProgress}%` }} />
          </div>
        </div>
        <div className={styles.userEmail}>{user?.email}</div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Wyloguj się
        </button>
      </div>
    </aside>
  );
}

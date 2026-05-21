import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../api/auth';
import styles from './LoginPage.module.scss';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Podaj adres email.'); return; }
    if (!password) { setError('Podaj hasło.'); return; }
    if (password.length < 6) { setError('Hasło musi mieć co najmniej 6 znaków.'); return; }
    if (password !== confirm) { setError('Hasła nie są identyczne.'); return; }

    setLoading(true);
    try {
      await apiRegister(email.trim(), password, question || undefined, answer || undefined);
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd rejestracji.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.accent}>Brain</span>Shelf
        </div>
        <h1 className={styles.title}>Utwórz konto</h1>
        <p className={styles.subtitle}>Zacznij organizować swoją naukę już dziś.</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              placeholder="student@uczelnia.edu.pl"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Hasło</label>
            <input
              className={styles.input}
              type="password"
              placeholder="Minimum 6 znaków"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Potwierdź hasło</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Pytanie kontrolne (opcjonalne)</label>
            <input
              className={styles.input}
              type="text"
              placeholder="np. Imię pierwszego zwierzaka"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>

          {question && (
            <div className={styles.field}>
              <label className={styles.label}>Odpowiedź</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Twoja odpowiedź"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
              />
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </button>
        </form>

        <p className={styles.footer}>
          Masz już konto?{' '}
          <Link to="/login" className={styles.link}>Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect, type FormEvent } from 'react';
import { getSets, getSet, createSet, addCard, markAsLearned, type FlashcardSet, type Flashcard } from '../api/flashcards';
import styles from './LanguagesPage.module.scss';

type View = 'sets' | 'cards' | 'study';

export default function LanguagesPage() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [activeSet, setActiveSet] = useState<FlashcardSet | null>(null);
  const [view, setView] = useState<View>('sets');
  const [loading, setLoading] = useState(true);

  const [showNewSet, setShowNewSet] = useState(false);
  const [setName, setSetName] = useState('');
  const [setError, setSetError] = useState('');
  const [setSubmitting, setSetSubmitting] = useState(false);

  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [cardError, setCardError] = useState('');
  const [cardSubmitting, setCardSubmitting] = useState(false);

  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    getSets()
      .then(setSets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openSet = async (s: FlashcardSet) => {
    try {
      const full = await getSet(s.id);
      setActiveSet(full);
      setView('cards');
    } catch { /* silent */ }
  };

  const handleCreateSet = async (e: FormEvent) => {
    e.preventDefault();
    setSetError('');
    if (!setName.trim()) { setSetError('Podaj nazwę zestawu.'); return; }
    setSetSubmitting(true);
    try {
      const created = await createSet(setName.trim());
      setSets(prev => [...prev, created]);
      setSetName(''); setShowNewSet(false);
    } catch (err) {
      setSetError(err instanceof Error ? err.message : 'Błąd.');
    } finally {
      setSetSubmitting(false);
    }
  };

  const handleAddCard = async (e: FormEvent) => {
    e.preventDefault();
    setCardError('');
    if (!word.trim()) { setCardError('Podaj słówko.'); return; }
    if (!translation.trim()) { setCardError('Podaj tłumaczenie.'); return; }
    if (!activeSet) return;

    setCardSubmitting(true);
    try {
      const card = await addCard(activeSet.id, word.trim(), translation.trim());
      setActiveSet(prev => prev ? { ...prev, flashcards: [...(prev.flashcards ?? []), card] } : prev);
      setWord(''); setTranslation('');
    } catch (err) {
      setCardError(err instanceof Error ? err.message : 'Błąd.');
    } finally {
      setCardSubmitting(false);
    }
  };

  const handleLearn = async (card: Flashcard) => {
    try {
      const updated = await markAsLearned(card.id);
      setActiveSet(prev => prev ? {
        ...prev,
        flashcards: prev.flashcards?.map(c => c.id === card.id ? updated : c)
      } : prev);
      if (view === 'study') {
        setStudyCards(prev => prev.map(c => c.id === card.id ? updated : c));
      }
    } catch { /* silent */ }
  };

  const startStudy = () => {
    const cards = activeSet?.flashcards?.filter(c => !c.is_learned) ?? [];
    if (cards.length === 0) return;
    setStudyCards(cards);
    setStudyIndex(0);
    setFlipped(false);
    setView('study');
  };

  const nextCard = () => {
    setFlipped(false);
    setStudyIndex(i => (i + 1) % studyCards.length);
  };

  const prevCard = () => {
    setFlipped(false);
    setStudyIndex(i => (i - 1 + studyCards.length) % studyCards.length);
  };

  const unlearnedCount = activeSet?.flashcards?.filter(c => !c.is_learned).length ?? 0;
  const learnedCount = activeSet?.flashcards?.filter(c => c.is_learned).length ?? 0;

  if (view === 'study' && studyCards.length > 0) {
    const card = studyCards[studyIndex];
    return (
      <div className={styles.page}>
        <div className={styles.studyHeader}>
          <button className={styles.backBtn} onClick={() => setView('cards')}>← Powrót</button>
          <span className={styles.studyProgress}>{studyIndex + 1} / {studyCards.length}</span>
        </div>
        <div className={styles.studyWrap}>
          <div className={`${styles.flashcard} ${flipped ? styles.flipped : ''}`} onClick={() => setFlipped(v => !v)}>
            <div className={styles.cardFront}>
              <div className={styles.cardSide}>Słówko</div>
              <div className={styles.cardWord}>{card.word}</div>
              <div className={styles.cardHint}>Kliknij, aby odkryć tłumaczenie</div>
            </div>
            <div className={styles.cardBack}>
              <div className={styles.cardSide}>Tłumaczenie</div>
              <div className={styles.cardWord}>{card.translation}</div>
            </div>
          </div>

          <div className={styles.studyActions}>
            <button className={styles.navCardBtn} onClick={prevCard}>←</button>
            {flipped && !card.is_learned && (
              <button className={styles.learnedBtn} onClick={() => { handleLearn(card); nextCard(); }}>
                ✓ Umiem
              </button>
            )}
            {flipped && card.is_learned && (
              <span className={styles.alreadyLearned}>Już nauczone ✓</span>
            )}
            <button className={styles.navCardBtn} onClick={nextCard}>→</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'cards' && activeSet) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.setHeader}>
            <button className={styles.backBtn} onClick={() => { setView('sets'); setActiveSet(null); }}>← Zestawy</button>
            <h1 className={styles.title}>{activeSet.name}</h1>
          </div>
          <div className={styles.headerActions}>
            {unlearnedCount > 0 && (
              <button className={styles.studyBtn} onClick={startStudy}>
                Ucz się ({unlearnedCount})
              </button>
            )}
            <div className={styles.setStats}>
              <span className={styles.learned}>{learnedCount} nauczone</span>
              <span className={styles.unlearned}>{unlearnedCount} pozostałe</span>
            </div>
          </div>
        </div>

        <div className={styles.addCardForm}>
          <h3 className={styles.addCardTitle}>Dodaj słówko</h3>
          <form className={styles.cardForm} onSubmit={handleAddCard} noValidate>
            <div className={styles.cardRow}>
              <div className={styles.field}>
                <label className={styles.label}>Słówko *</label>
                <input className={styles.input} placeholder="np. ubiquitous" value={word} onChange={e => setWord(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tłumaczenie *</label>
                <input className={styles.input} placeholder="np. wszechobecny" value={translation} onChange={e => setTranslation(e.target.value)} />
              </div>
              <button type="submit" className={styles.addCardBtn} disabled={cardSubmitting}>
                {cardSubmitting ? '...' : '+'}
              </button>
            </div>
            {cardError && <div className={styles.error}>{cardError}</div>}
          </form>
        </div>

        {!activeSet.flashcards || activeSet.flashcards.length === 0 ? (
          <div className={styles.empty}>Brak słówek. Dodaj pierwsze!</div>
        ) : (
          <div className={styles.cardGrid}>
            {activeSet.flashcards.map(c => (
              <div key={c.id} className={`${styles.vocabCard} ${c.is_learned ? styles.vocabLearned : ''}`}>
                <div className={styles.vocabWord}>{c.word}</div>
                <div className={styles.vocabArrow}>↔</div>
                <div className={styles.vocabTranslation}>{c.translation}</div>
                {!c.is_learned && (
                  <button className={styles.markLearnedBtn} onClick={() => handleLearn(c)}>✓</button>
                )}
                {c.is_learned && <span className={styles.learnedMark}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Języki</h1>
          <p className={styles.subtitle}>Zestawy słówek i codzienna nauka</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowNewSet(v => !v)}>
          {showNewSet ? '✕ Zamknij' : '+ Nowy zestaw'}
        </button>
      </div>

      {showNewSet && (
        <div className={styles.formCard}>
          <form className={styles.inlineForm} onSubmit={handleCreateSet} noValidate>
            <div className={styles.field}>
              <label className={styles.label}>Nazwa zestawu *</label>
              <input className={styles.input} placeholder="np. Angielski B2" value={setName} onChange={e => setSetName(e.target.value)} />
            </div>
            {setError && <div className={styles.error}>{setError}</div>}
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => { setShowNewSet(false); setSetName(''); }}>Anuluj</button>
              <button type="submit" className={styles.submitBtn} disabled={setSubmitting}>
                {setSubmitting ? 'Tworzenie...' : 'Utwórz zestaw'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Ładowanie...</div>
      ) : sets.length === 0 ? (
        <div className={styles.empty}>Brak zestawów. Utwórz pierwszy!</div>
      ) : (
        <div className={styles.setsGrid}>
          {sets.map(s => (
            <button key={s.id} className={styles.setCard} onClick={() => openSet(s)}>
              <div className={styles.setIcon}>◎</div>
              <div className={styles.setName}>{s.name}</div>
              <div className={styles.setArrow}>→</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

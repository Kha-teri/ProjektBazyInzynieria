import { apiRequest } from './client';

export interface Flashcard {
  id: number;
  word: string;
  translation: string;
  is_learned: boolean;
  set_id: number;
}

export interface FlashcardSet {
  id: number;
  name: string;
  flashcards?: Flashcard[];
}

export const getSets = () => apiRequest<FlashcardSet[]>('/flashcards/sets');

export const getSet = (setId: number) =>
  apiRequest<FlashcardSet>(`/flashcards/sets/${setId}`);

export const createSet = (name: string) =>
  apiRequest<FlashcardSet>('/flashcards/sets', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const addCard = (setId: number, word: string, translation: string) =>
  apiRequest<Flashcard>(`/flashcards/sets/${setId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ word, translation }),
  });

export const markAsLearned = (cardId: number) =>
  apiRequest<Flashcard>(`/flashcards/cards/${cardId}/learned`, { method: 'PATCH' });

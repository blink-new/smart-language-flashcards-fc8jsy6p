import { FlashcardSet, Word } from '../types/flashcard'

// Local storage keys
const SETS_KEY = 'memora_flashcard_sets'
const WORDS_KEY = 'memora_words'

// Flashcard Sets Storage
export function saveFlashcardSet(set: FlashcardSet): void {
  const sets = getFlashcardSets()
  const existingIndex = sets.findIndex(s => s.id === set.id)
  
  if (existingIndex >= 0) {
    sets[existingIndex] = { ...set, updatedAt: new Date().toISOString() }
  } else {
    sets.push(set)
  }
  
  localStorage.setItem(SETS_KEY, JSON.stringify(sets))
}

export function getFlashcardSets(userId?: string): FlashcardSet[] {
  try {
    const sets = JSON.parse(localStorage.getItem(SETS_KEY) || '[]') as FlashcardSet[]
    return userId ? sets.filter(set => set.userId === userId) : sets
  } catch {
    return []
  }
}

export function getFlashcardSet(id: string): FlashcardSet | null {
  const sets = getFlashcardSets()
  return sets.find(set => set.id === id) || null
}

export function deleteFlashcardSet(id: string): void {
  const sets = getFlashcardSets()
  const filtered = sets.filter(set => set.id !== id)
  localStorage.setItem(SETS_KEY, JSON.stringify(filtered))
  
  // Also delete associated words
  const words = getWords()
  const filteredWords = words.filter(word => word.setId !== id)
  localStorage.setItem(WORDS_KEY, JSON.stringify(filteredWords))
}

// Words Storage
export function saveWords(words: Word[]): void {
  const existingWords = getWords()
  
  words.forEach(word => {
    const existingIndex = existingWords.findIndex(w => w.id === word.id)
    if (existingIndex >= 0) {
      existingWords[existingIndex] = word
    } else {
      existingWords.push(word)
    }
  })
  
  localStorage.setItem(WORDS_KEY, JSON.stringify(existingWords))
}

export function getWords(setId?: string): Word[] {
  try {
    const words = JSON.parse(localStorage.getItem(WORDS_KEY) || '[]') as Word[]
    return setId ? words.filter(word => word.setId === setId) : words
  } catch {
    return []
  }
}

export function getWord(id: string): Word | null {
  const words = getWords()
  return words.find(word => word.id === id) || null
}

export function updateWord(word: Word): void {
  const words = getWords()
  const index = words.findIndex(w => w.id === word.id)
  
  if (index >= 0) {
    words[index] = word
    localStorage.setItem(WORDS_KEY, JSON.stringify(words))
  }
}

export function deleteWord(id: string): void {
  const words = getWords()
  const filtered = words.filter(word => word.id !== id)
  localStorage.setItem(WORDS_KEY, JSON.stringify(filtered))
}

// Utility functions
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function updateSetWordCount(setId: string): void {
  const set = getFlashcardSet(setId)
  if (set) {
    const wordCount = getWords(setId).length
    saveFlashcardSet({ ...set, wordCount })
  }
}
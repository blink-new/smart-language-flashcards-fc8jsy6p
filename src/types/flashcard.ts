export interface FlashcardSet {
  id: string
  userId: string
  name: string
  targetLanguage: string
  definitionLanguage: string
  createdAt: string
  updatedAt: string
  wordCount: number
}

export interface Word {
  id: string
  setId: string
  word: string
  definition: string
  pronunciation?: string
  audioUrl?: string
  imageUrl?: string
  example?: string
  partOfSpeech?: string
  difficulty: 'easy' | 'medium' | 'hard'
  lastStudied?: string
  correctCount: number
  incorrectCount: number
  createdAt: string
}

export interface UploadedWord {
  word: string
  definition?: string
  context?: string
}

export interface EnhancedWord extends UploadedWord {
  definition: string
  pronunciation: string
  audioUrl?: string
  imageUrl?: string
  example?: string
  partOfSpeech?: string
}
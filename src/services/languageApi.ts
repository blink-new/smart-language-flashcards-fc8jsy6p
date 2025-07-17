import { blink } from '../blink/client'
import { EnhancedWord, UploadedWord } from '../types/flashcard'

// Dictionary API service for definitions
export async function getWordDefinition(word: string, targetLang: string, definitionLang: string): Promise<{
  definition: string
  pronunciation?: string
  partOfSpeech?: string
  example?: string
}> {
  try {
    // Use Free Dictionary API for English definitions
    if (definitionLang === 'en') {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      
      if (response.ok) {
        const data = await response.json()
        const entry = data[0]
        const meaning = entry.meanings?.[0]
        const definition = meaning?.definitions?.[0]
        
        return {
          definition: definition?.definition || `Definition for "${word}"`,
          pronunciation: entry.phonetic || entry.phonetics?.[0]?.text,
          partOfSpeech: meaning?.partOfSpeech,
          example: definition?.example
        }
      }
    }
    
    // Fallback: Use AI to generate definition and pronunciation
    const { text } = await blink.ai.generateText({
      prompt: `Provide a definition, pronunciation (IPA), part of speech, and example sentence for the ${targetLang} word "${word}" in ${definitionLang}. Format as JSON: {"definition": "...", "pronunciation": "...", "partOfSpeech": "...", "example": "..."}`,
      maxTokens: 200
    })
    
    try {
      const parsed = JSON.parse(text)
      return {
        definition: parsed.definition || `Definition for "${word}"`,
        pronunciation: parsed.pronunciation,
        partOfSpeech: parsed.partOfSpeech,
        example: parsed.example
      }
    } catch {
      return {
        definition: text.trim() || `Definition for "${word}"`
      }
    }
  } catch (error) {
    console.error('Error getting definition:', error)
    return {
      definition: `Definition for "${word}"`
    }
  }
}

// Generate pronunciation audio using AI
export async function generatePronunciationAudio(word: string, language: string): Promise<string | undefined> {
  try {
    // Map language codes to voice names
    const voiceMap: Record<string, string> = {
      'en': 'nova',
      'es': 'nova', // Will sound Spanish when given Spanish text
      'fr': 'nova',
      'de': 'nova',
      'it': 'nova',
      'pt': 'nova'
    }
    
    const voice = voiceMap[language] || 'nova'
    
    const { url } = await blink.ai.generateSpeech({
      text: word,
      voice: voice as any
    })
    
    return url
  } catch (error) {
    console.error('Error generating pronunciation:', error)
    return undefined
  }
}

// Generate visual learning aid using AI
export async function generateWordImage(word: string, definition: string): Promise<string | undefined> {
  try {
    const { data } = await blink.ai.generateImage({
      prompt: `A simple, clear illustration representing the word "${word}" (${definition}). Educational style, clean background, suitable for language learning flashcards.`,
      size: '1024x1024',
      quality: 'medium',
      n: 1
    })
    
    return data[0]?.url
  } catch (error) {
    console.error('Error generating image:', error)
    return undefined
  }
}

// Enhance a list of words with definitions, pronunciations, and images
export async function enhanceWords(
  words: UploadedWord[],
  targetLanguage: string,
  definitionLanguage: string,
  onProgress?: (progress: number) => void
): Promise<EnhancedWord[]> {
  const enhanced: EnhancedWord[] = []
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    
    try {
      // Get definition and pronunciation
      const definition = await getWordDefinition(word.word, targetLanguage, definitionLanguage)
      
      // Generate audio pronunciation
      const audioUrl = await generatePronunciationAudio(word.word, targetLanguage)
      
      // Generate visual aid (optional, can be slow)
      const imageUrl = await generateWordImage(word.word, definition.definition)
      
      enhanced.push({
        ...word,
        definition: definition.definition,
        pronunciation: definition.pronunciation || '',
        audioUrl,
        imageUrl,
        example: definition.example,
        partOfSpeech: definition.partOfSpeech
      })
      
      // Report progress
      if (onProgress) {
        onProgress(((i + 1) / words.length) * 100)
      }
    } catch (error) {
      console.error(`Error enhancing word "${word.word}":`, error)
      
      // Add word with minimal enhancement
      enhanced.push({
        ...word,
        definition: word.definition || `Definition for "${word.word}"`,
        pronunciation: ''
      })
      
      if (onProgress) {
        onProgress(((i + 1) / words.length) * 100)
      }
    }
  }
  
  return enhanced
}
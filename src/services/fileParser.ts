import { UploadedWord } from '../types/flashcard'
import { blink } from '../blink/client'

// Parse Excel/CSV files
export async function parseSpreadsheetFile(file: File): Promise<UploadedWord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          const words = parseCSV(content)
          resolve(words)
        } else {
          // For Excel files, we'll use a simple approach
          // In a real app, you'd use a library like xlsx
          reject(new Error('Excel files not yet supported. Please use CSV format.'))
        }
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// Parse CSV content
function parseCSV(content: string): UploadedWord[] {
  const lines = content.split('\n').filter(line => line.trim())
  const words: UploadedWord[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Split by comma, handling quoted values
    const columns = parseCSVLine(line)
    
    if (columns.length >= 1) {
      const word = columns[0].trim()
      if (word) {
        words.push({
          word,
          definition: columns[1]?.trim() || undefined,
          context: columns[2]?.trim() || undefined
        })
      }
    }
  }
  
  return words
}

// Parse a single CSV line, handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result.map(col => col.replace(/^"|"$/g, ''))
}

// Extract text from images using AI
export async function extractTextFromImage(file: File): Promise<UploadedWord[]> {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file)
    
    // Use AI to extract text from image
    const { text } = await blink.ai.generateText({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all words from this image. Return them as a simple list, one word per line. Only return the words, no other text.'
            },
            {
              type: 'image',
              image: base64
            }
          ]
        }
      ]
    })
    
    // Parse extracted text into words
    const words = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.includes(' ')) // Filter out phrases
      .map(word => ({ word }))
    
    return words
  } catch (error) {
    console.error('Error extracting text from image:', error)
    throw new Error('Failed to extract text from image')
  }
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
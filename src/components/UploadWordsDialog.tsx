import { useState, useRef } from 'react'
import * as React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent } from './ui/card'
import { Progress } from './ui/progress'
import { Upload, FileText, Image, Table, Loader2 } from 'lucide-react'
import { useToast } from '../hooks/use-toast'
import { blink } from '../blink/client'
import { parseSpreadsheetFile, extractTextFromImage } from '../services/fileParser'
import { enhanceWords } from '../services/languageApi'
import { saveFlashcardSet, saveWords, generateId, getFlashcardSets } from '../services/storage'
import { FlashcardSet, Word } from '../types/flashcard'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'he', name: 'Hebrew' }
]

export default function UploadWordsDialog({ open, onOpenChange }: Props) {
  const [targetLanguage, setTargetLanguage] = useState('')
  const [definitionLanguage, setDefinitionLanguage] = useState('en')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedSet, setSelectedSet] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  // Get user's flashcard sets
  const [userSets, setUserSets] = useState<FlashcardSet[]>([])
  
  // Load user sets when dialog opens
  React.useEffect(() => {
    if (open) {
      const loadSets = async () => {
        try {
          const user = await blink.auth.me()
          const sets = getFlashcardSets(user.id)
          setUserSets(sets)
        } catch (error) {
          console.error('Error loading sets:', error)
        }
      }
      loadSets()
    }
  }, [open])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !targetLanguage || !definitionLanguage) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and choose both languages.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setProgress(0)
    
    try {
      const user = await blink.auth.me()
      
      // Step 1: Parse file
      setProcessingStep('Parsing file...')
      setProgress(10)
      
      let uploadedWords
      const fileName = selectedFile.name.toLowerCase()
      
      if (fileName.endsWith('.csv')) {
        uploadedWords = await parseSpreadsheetFile(selectedFile)
      } else if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
        uploadedWords = await extractTextFromImage(selectedFile)
      } else {
        throw new Error('Unsupported file format. Please use CSV or image files.')
      }
      
      if (uploadedWords.length === 0) {
        throw new Error('No words found in the file.')
      }
      
      setProgress(30)
      
      // Step 2: Enhance words with AI
      setProcessingStep(`Enhancing ${uploadedWords.length} words with definitions and pronunciations...`)
      
      const enhancedWords = await enhanceWords(
        uploadedWords,
        targetLanguage,
        definitionLanguage,
        (progress) => setProgress(30 + (progress * 0.6)) // 30% to 90%
      )
      
      setProgress(90)
      
      // Step 3: Create or use existing set
      let flashcardSet: FlashcardSet
      
      if (selectedSet) {
        // Use existing set
        const existingSet = userSets.find(s => s.id === selectedSet)
        if (!existingSet) {
          throw new Error('Selected flashcard set not found.')
        }
        flashcardSet = existingSet
      } else {
        // Create new set
        const setName = `${LANGUAGES.find(l => l.code === targetLanguage)?.name} Words - ${new Date().toLocaleDateString()}`
        flashcardSet = {
          id: generateId(),
          userId: user.id,
          name: setName,
          targetLanguage,
          definitionLanguage,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: 0
        }
        saveFlashcardSet(flashcardSet)
      }
      
      // Step 4: Save words
      setProcessingStep('Saving words...')
      
      const words: Word[] = enhancedWords.map(word => ({
        id: generateId(),
        setId: flashcardSet.id,
        word: word.word,
        definition: word.definition,
        pronunciation: word.pronunciation || '',
        audioUrl: word.audioUrl,
        imageUrl: word.imageUrl,
        example: word.example,
        partOfSpeech: word.partOfSpeech,
        difficulty: 'medium' as const,
        correctCount: 0,
        incorrectCount: 0,
        createdAt: new Date().toISOString()
      }))
      
      saveWords(words)
      
      // Update set word count
      flashcardSet.wordCount = (flashcardSet.wordCount || 0) + words.length
      flashcardSet.updatedAt = new Date().toISOString()
      saveFlashcardSet(flashcardSet)
      
      setProgress(100)
      
      toast({
        title: 'Upload Complete!',
        description: `Successfully processed ${words.length} words and added them to "${flashcardSet.name}".`
      })
      
      // Reset form
      setSelectedFile(null)
      setTargetLanguage('')
      setDefinitionLanguage('en')
      setSelectedSet('')
      setProgress(0)
      setProcessingStep('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onOpenChange(false)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to process the file. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setProgress(0)
      setProcessingStep('')
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return <Table className="h-8 w-8 text-green-600" />
      case 'csv':
        return <FileText className="h-8 w-8 text-blue-600" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-8 w-8 text-purple-600" />
      default:
        return <FileText className="h-8 w-8 text-gray-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Words</DialogTitle>
          <DialogDescription>
            Import vocabulary from Excel, CSV files, or extract text from photos. We'll automatically enhance each word with definitions, pronunciations, and visual aids.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Language Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetLanguage">Target Language</Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage} required>
                <SelectTrigger>
                  <SelectValue placeholder="Learning..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="definitionLanguage">Definition Language</Label>
              <Select value={definitionLanguage} onValueChange={setDefinitionLanguage} required>
                <SelectTrigger>
                  <SelectValue placeholder="Definitions in..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Flashcard Set Selection */}
          <div className="space-y-2">
            <Label htmlFor="flashcardSet">Add to Flashcard Set (Optional)</Label>
            <Select value={selectedSet} onValueChange={setSelectedSet}>
              <SelectTrigger>
                <SelectValue placeholder="Create new set or select existing..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Create New Set</SelectItem>
                {userSets.map((set) => (
                  <SelectItem key={set.id} value={set.id}>
                    {set.name} ({set.wordCount || 0} words)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <Label>Upload File</Label>
            
            {!selectedFile ? (
              <Card className="border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 text-center mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    Supports Excel (.xlsx), CSV (.csv), and Images (.jpg, .png)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center space-x-4 py-4">
                  {getFileIcon(selectedFile.name)}
                  <div className="flex-1">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Progress Indicator */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">{processingStep}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={loading || !selectedFile}>
              {loading ? 'Processing...' : 'Upload & Process'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
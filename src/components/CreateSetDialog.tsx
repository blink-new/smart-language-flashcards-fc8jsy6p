import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useToast } from '../hooks/use-toast'
import { blink } from '../blink/client'
import { saveFlashcardSet, generateId } from '../services/storage'
import { FlashcardSet } from '../types/flashcard'

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

export default function CreateSetDialog({ open, onOpenChange }: Props) {
  const [setName, setSetName] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [definitionLanguage, setDefinitionLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!setName.trim() || !targetLanguage || !definitionLanguage) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    
    try {
      // Get current user
      const user = await blink.auth.me()
      
      // Create new flashcard set
      const newSet: FlashcardSet = {
        id: generateId(),
        userId: user.id,
        name: setName.trim(),
        targetLanguage,
        definitionLanguage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: 0
      }
      
      // Save to local storage
      saveFlashcardSet(newSet)
      
      toast({
        title: 'Set Created!',
        description: `Created "${setName}" for learning ${LANGUAGES.find(l => l.code === targetLanguage)?.name} with ${LANGUAGES.find(l => l.code === definitionLanguage)?.name} definitions.`
      })
      
      // Reset form
      setSetName('')
      setTargetLanguage('')
      setDefinitionLanguage('en')
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating set:', error)
      toast({
        title: 'Error',
        description: 'Failed to create flashcard set. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Flashcard Set</DialogTitle>
          <DialogDescription>
            Set up a new vocabulary learning set with your preferred languages.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setName">Set Name</Label>
            <Input
              id="setName"
              placeholder="e.g., French Vocabulary - Beginner"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetLanguage">Target Language (What you're learning)</Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage} required>
              <SelectTrigger>
                <SelectValue placeholder="Select the language you want to learn" />
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
            <Label htmlFor="definitionLanguage">Definition Language (Language for definitions)</Label>
            <Select value={definitionLanguage} onValueChange={setDefinitionLanguage} required>
              <SelectTrigger>
                <SelectValue placeholder="Select language for definitions" />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Set'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
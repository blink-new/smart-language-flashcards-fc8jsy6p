import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent } from './ui/card'
import { Upload, FileText, Image, Table } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

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
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

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
    
    try {
      // For now, just show success message
      // Later we'll integrate with file processing and AI enhancement
      toast({
        title: 'Upload Started!',
        description: `Processing ${selectedFile.name} for ${LANGUAGES.find(l => l.code === targetLanguage)?.name} words with ${LANGUAGES.find(l => l.code === definitionLanguage)?.name} definitions.`
      })
      
      // Reset form
      setSelectedFile(null)
      setTargetLanguage('')
      setDefinitionLanguage('en')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to process the file. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
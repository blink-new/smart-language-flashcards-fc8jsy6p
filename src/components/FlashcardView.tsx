import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Volume2, RotateCcw, CheckCircle, XCircle, ArrowLeft, Info } from 'lucide-react'
import { blink } from '../blink/client'

interface Props {
  setId: string
  onComplete: () => void
}

// Mock flashcard data with enhanced content
const MOCK_CARDS = [
  {
    id: '1',
    word: 'Bonjour',
    definition: 'Hello, Good morning',
    pronunciation: 'bon-ZHOOR',
    imageUrl: null, // Will be generated with AI
    difficulty: 1,
    synonyms: [], // Easy words (A1) don't get synonyms
    exampleSentence: 'Bonjour, comment allez-vous?',
    exampleTranslation: 'Hello, how are you?'
  },
  {
    id: '2',
    word: 'Merci',
    definition: 'Thank you',
    pronunciation: 'mer-SEE',
    imageUrl: null, // Will be generated with AI
    difficulty: 1,
    synonyms: [], // Easy words (A1) don't get synonyms
    exampleSentence: 'Merci beaucoup pour votre aide.',
    exampleTranslation: 'Thank you very much for your help.'
  },
  {
    id: '3',
    word: 'Au revoir',
    definition: 'Goodbye',
    pronunciation: 'oh ruh-VWAHR',
    imageUrl: null, // Will be generated with AI
    difficulty: 2,
    synonyms: [
      { word: 'Adieu', definition: 'Farewell (more formal/permanent goodbye)' }
    ],
    exampleSentence: 'Au revoir, à bientôt!',
    exampleTranslation: 'Goodbye, see you soon!'
  },
  {
    id: '4',
    word: 'Excusez-moi',
    definition: 'Excuse me',
    pronunciation: 'ek-skew-zay MWAH',
    imageUrl: null, // Will be generated with AI
    difficulty: 2,
    synonyms: [
      { word: 'Pardon', definition: 'Sorry, pardon me (more casual)' }
    ],
    exampleSentence: 'Excusez-moi, où est la gare?',
    exampleTranslation: 'Excuse me, where is the train station?'
  },
  {
    id: '5',
    word: 'S\'il vous plaît',
    definition: 'Please',
    pronunciation: 'seel voo PLEH',
    imageUrl: null, // Will be generated with AI
    difficulty: 3,
    synonyms: [
      { word: 'Je vous prie', definition: 'I beg you (very formal please)' },
      { word: 'Je vous en prie', definition: 'You\'re welcome / Please do' },
      { word: 'Veuillez', definition: 'Please (formal imperative form)' }
    ],
    exampleSentence: 'Pouvez-vous m\'aider, s\'il vous plaît?',
    exampleTranslation: 'Can you help me, please?'
  }
]

export default function FlashcardView({ setId, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionCards, setSessionCards] = useState(MOCK_CARDS)
  const [selectedSynonym, setSelectedSynonym] = useState<{word: string, definition: string} | null>(null)
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string}>({})
  const [loadingImages, setLoadingImages] = useState<{[key: string]: boolean}>({})

  const currentCard = sessionCards[currentIndex]
  const progress = ((currentIndex + 1) / sessionCards.length) * 100

  // Generate AI image for a word
  const generateImageForWord = useCallback(async (word: string, definition: string) => {
    if (generatedImages[word] || loadingImages[word]) return
    
    setLoadingImages(prev => ({ ...prev, [word]: true }))
    
    try {
      const { data } = await blink.ai.generateImage({
        prompt: `A clear, simple illustration representing the concept of "${definition}" for language learning. Clean, educational style with good contrast and clear visual elements. No text in the image.`,
        size: '1024x1024',
        quality: 'high',
        n: 1
      })
      
      if (data && data[0]?.url) {
        setGeneratedImages(prev => ({ ...prev, [word]: data[0].url }))
      }
    } catch (error) {
      console.error('Failed to generate image:', error)
    } finally {
      setLoadingImages(prev => ({ ...prev, [word]: false }))
    }
  }, [generatedImages, loadingImages])

  // Generate image when card changes
  useEffect(() => {
    if (currentCard && !generatedImages[currentCard.word]) {
      generateImageForWord(currentCard.word, currentCard.definition)
    }
  }, [currentCard, generatedImages, generateImageForWord])

  const playPronunciation = () => {
    // In a real app, this would use text-to-speech or audio files
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentCard.word)
      utterance.lang = 'fr-FR' // French pronunciation
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
    }

    // Move to next card after a short delay
    setTimeout(() => {
      if (currentIndex < sessionCards.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setIsFlipped(false)
      } else {
        // Session complete
        onComplete()
      }
    }, 1000)
  }

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-100 text-green-800'
      case 2: return 'bg-yellow-100 text-yellow-800'
      case 3: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Easy'
      case 2: return 'Medium'
      case 3: return 'Hard'
      default: return 'Unknown'
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onComplete}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sets
        </Button>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Card {currentIndex + 1} of {sessionCards.length}
          </p>
          <p className="text-xs text-gray-500">
            Correct: {correctCount}/{currentIndex + 1}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="w-full" />

      {/* Flashcard */}
      <div className="relative h-96">
        <div
          className={`absolute inset-0 w-full h-full transition-transform duration-500 transform-style-preserve-3d cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of card (Word) */}
          <Card className="absolute inset-0 w-full h-full backface-hidden">
            <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Badge className={`mb-4 ${getDifficultyColor(currentCard.difficulty)}`}>
                {getDifficultyLabel(currentCard.difficulty)}
              </Badge>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {currentCard.word}
              </h1>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  playPronunciation()
                }}
                className="mb-6"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {currentCard.pronunciation}
              </Button>

              <p className="text-gray-600 text-sm">Click to reveal definition</p>
            </CardContent>
          </Card>

          {/* Back of card (Definition) */}
          <Card className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
            <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center overflow-y-auto">
              <div className="mb-4">
                {/* AI Generated Image */}
                <div className="w-32 h-24 mb-4 mx-auto">
                  {loadingImages[currentCard.word] ? (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : generatedImages[currentCard.word] ? (
                    <img
                      src={generatedImages[currentCard.word]}
                      alt={currentCard.word}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Generating...</span>
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {currentCard.word}
                </h2>
                <p className="text-lg text-gray-700 mb-3">
                  {currentCard.definition}
                </p>
                
                {/* Example sentence */}
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-1">Example:</p>
                  <p className="text-sm text-green-700 font-medium mb-1">
                    {currentCard.exampleSentence}
                  </p>
                  <p className="text-xs text-green-600 italic">
                    {currentCard.exampleTranslation}
                  </p>
                </div>
                
                {/* Synonyms section */}
                {currentCard.synonyms && currentCard.synonyms.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      Synonyms in French:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {currentCard.synonyms.map((synonym, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSynonym(synonym)
                          }}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          {synonym.word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAnswer(false)
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Incorrect
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAnswer(true)
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Correct
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Flip Card
        </Button>
      </div>

      {/* Synonym Definition Dialog */}
      <Dialog open={!!selectedSynonym} onOpenChange={() => setSelectedSynonym(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Synonym Definition
            </DialogTitle>
          </DialogHeader>
          {selectedSynonym && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedSynonym.word}
                </h3>
                <p className="text-gray-700">
                  {selectedSynonym.definition}
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      const utterance = new SpeechSynthesisUtterance(selectedSynonym.word)
                      utterance.lang = 'fr-FR'
                      utterance.rate = 0.8
                      speechSynthesis.speak(utterance)
                    }
                  }}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Pronounce
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
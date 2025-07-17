import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Play, BookOpen, RotateCcw } from 'lucide-react'
import FlashcardView from './FlashcardView'

// Mock data for demonstration
const MOCK_SETS = [
  {
    id: '1',
    name: 'French Basics',
    targetLanguage: 'French',
    definitionLanguage: 'English',
    cardCount: 25,
    studiedToday: 12,
    accuracy: 85
  },
  {
    id: '2',
    name: 'Spanish Verbs',
    targetLanguage: 'Spanish',
    definitionLanguage: 'English',
    cardCount: 40,
    studiedToday: 0,
    accuracy: 92
  }
]

export default function StudyMode() {
  const [selectedSet, setSelectedSet] = useState<string | null>(null)
  const [isStudying, setIsStudying] = useState(false)

  if (isStudying && selectedSet) {
    return (
      <FlashcardView
        setId={selectedSet}
        onComplete={() => {
          setIsStudying(false)
          setSelectedSet(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Mode</h2>
        <p className="text-gray-600">Choose a flashcard set to start studying</p>
      </div>

      {MOCK_SETS.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcard sets yet</h3>
            <p className="text-gray-600 mb-4">Create your first set to start studying</p>
            <Button>Create New Set</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_SETS.map((set) => (
            <Card key={set.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{set.name}</CardTitle>
                    <CardDescription>
                      {set.targetLanguage} → {set.definitionLanguage}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{set.cardCount} cards</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Studied today:</span>
                  <span className="font-medium">{set.studiedToday}/{set.cardCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium text-green-600">{set.accuracy}%</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setSelectedSet(set.id)
                      setIsStudying(true)
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Study
                  </Button>
                  <Button variant="outline" size="icon">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
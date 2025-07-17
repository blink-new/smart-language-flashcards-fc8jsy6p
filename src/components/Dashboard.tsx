import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Plus, BookOpen, Upload, BarChart3, LogOut, Share2, Play, Trash2 } from 'lucide-react'
import { blink } from '../blink/client'
import CreateSetDialog from './CreateSetDialog'
import UploadWordsDialog from './UploadWordsDialog'
import StudyMode from './StudyMode'
import { getFlashcardSets, deleteFlashcardSet } from '../services/storage'
import { FlashcardSet } from '../types/flashcard'
import { useToast } from '../hooks/use-toast'

interface User {
  id: string
  email: string
  displayName?: string
}

interface Props {
  user: User
}

export default function Dashboard({ user }: Props) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showCreateSet, setShowCreateSet] = useState(false)
  const [showUploadWords, setShowUploadWords] = useState(false)
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([])
  const { toast } = useToast()

  // Load flashcard sets
  useEffect(() => {
    const loadSets = () => {
      const sets = getFlashcardSets(user.id)
      setFlashcardSets(sets)
    }
    
    loadSets()
    
    // Refresh sets when dialogs close
    const interval = setInterval(loadSets, 1000)
    return () => clearInterval(interval)
  }, [user.id])

  const handleDeleteSet = (setId: string) => {
    if (confirm('Are you sure you want to delete this flashcard set? This action cannot be undone.')) {
      deleteFlashcardSet(setId)
      setFlashcardSets(prev => prev.filter(set => set.id !== setId))
      toast({
        title: 'Set Deleted',
        description: 'Flashcard set has been deleted successfully.'
      })
    }
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Memora - Smart Language Learning',
          text: 'Check out this amazing language learning app!',
          url: window.location.origin,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin)
      // You could show a toast here
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <h1 className="text-xl font-semibold text-gray-900">Memora</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user.displayName || user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="upload" className="text-xs sm:text-sm">Upload</TabsTrigger>
            <TabsTrigger value="study" className="text-xs sm:text-sm">Study</TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreateSet(true)}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Plus className="h-5 w-5 mr-2 text-indigo-600" />
                    Create New Set
                  </CardTitle>
                  <CardDescription>Start a new flashcard set for language learning</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowUploadWords(true)}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Upload className="h-5 w-5 mr-2 text-amber-600" />
                    Upload Words
                  </CardTitle>
                  <CardDescription>Import words from Excel, CSV, or photos</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('progress')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                    View Progress
                  </CardTitle>
                  <CardDescription>Track your learning statistics</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Recent Sets */}
            <Card>
              <CardHeader>
                <CardTitle>Your Flashcard Sets</CardTitle>
                <CardDescription>Continue learning with your existing sets</CardDescription>
              </CardHeader>
              <CardContent>
                {flashcardSets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No flashcard sets yet. Create your first set to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flashcardSets.map((set) => (
                      <Card key={set.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base line-clamp-2">{set.name}</CardTitle>
                              <CardDescription className="text-sm mt-1">
                                {set.wordCount || 0} words
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSet(set.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {set.targetLanguage.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Definitions: {set.definitionLanguage.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Updated {new Date(set.updatedAt).toLocaleDateString()}
                            </span>
                            <Button size="sm" onClick={() => setActiveTab('study')}>
                              <Play className="h-4 w-4 mr-1" />
                              Study
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Words</CardTitle>
                <CardDescription>Import vocabulary from various sources</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowUploadWords(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Words
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="study">
            <StudyMode />
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>Track your vocabulary learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Start studying to see your progress here!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <CreateSetDialog open={showCreateSet} onOpenChange={setShowCreateSet} />
      <UploadWordsDialog open={showUploadWords} onOpenChange={setShowUploadWords} />
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Made with ❤️ using{' '}
              <a href="https://blink.new" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">
                Blink
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Share this app: {window.location.origin}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
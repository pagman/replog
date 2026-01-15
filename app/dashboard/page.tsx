"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import Navbar from "@/components/Navbar"
import Link from "next/link"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
}

interface Program {
  id: string
  name: string
  description?: string
  exercises: Exercise[]
  createdAt: string
  sharedById?: string
  sharedByName?: string
}

interface Workout {
  id: string
  date: string
  program: {
    name: string
  }
  completed: boolean
  duration?: number
}

export default function Dashboard() {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [unfinishedWorkouts, setUnfinishedWorkouts] = useState<Set<string>>(new Set())
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [shareEmail, setShareEmail] = useState("")
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState("")
  const [shareSuccess, setShareSuccess] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [workoutPage, setWorkoutPage] = useState(1)
  const workoutsPerPage = 4

  useEffect(() => {
    fetchData()
    checkUnfinishedWorkouts()
  }, [])

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null)
      }
    }

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  const checkUnfinishedWorkouts = () => {
    const unfinished = new Set<string>()

    // Check localStorage for any saved workout progress
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('workout-progress-')) {
        const programId = key.replace('workout-progress-', '')
        try {
          const savedProgress = localStorage.getItem(key)
          if (savedProgress) {
            const { timestamp } = JSON.parse(savedProgress)
            // Only count if less than 24 hours old
            const hoursSinceSave = (Date.now() - timestamp) / (1000 * 60 * 60)
            if (hoursSinceSave < 24) {
              unfinished.add(programId)
            } else {
              // Clean up old progress
              localStorage.removeItem(key)
            }
          }
        } catch (error) {
          console.error('Error checking saved progress:', error)
        }
      }
    }

    setUnfinishedWorkouts(unfinished)
  }

  const fetchData = async () => {
    try {
      const [programsRes, workoutsRes] = await Promise.all([
        fetch("/api/programs"),
        fetch("/api/workouts")
      ])

      const programsData = await programsRes.json()
      const workoutsData = await workoutsRes.json()

      setPrograms(programsData)
      setRecentWorkouts(workoutsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProgram = async (id: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return

    try {
      const response = await fetch(`/api/programs?id=${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setPrograms(programs.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error("Error deleting program:", error)
    }
  }

  const discardWorkoutProgress = (programId: string) => {
    if (confirm("Are you sure you want to discard this workout in progress?")) {
      localStorage.removeItem(`workout-progress-${programId}`)
      checkUnfinishedWorkouts()
    }
  }

  const openShareModal = (programId: string) => {
    setSelectedProgramId(programId)
    setShareModalOpen(true)
    setShareEmail("")
    setShareError("")
    setShareSuccess("")
  }

  const closeShareModal = () => {
    setShareModalOpen(false)
    setSelectedProgramId(null)
    setShareEmail("")
    setShareError("")
    setShareSuccess("")
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProgramId) return

    setShareError("")
    setShareSuccess("")
    setShareLoading(true)

    try {
      const response = await fetch(`/api/programs/${selectedProgramId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: shareEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setShareSuccess(data.message || "Program shared successfully!")
        setShareEmail("")
        setTimeout(() => {
          closeShareModal()
        }, 2000)
      } else {
        setShareError(data.error || "Failed to share program")
      }
    } catch (error) {
      setShareError("Something went wrong")
    } finally {
      setShareLoading(false)
    }
  }

  const toggleMenu = (e: React.MouseEvent, programId: string) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === programId ? null : programId)
  }

  const handleEditClick = (programId: string) => {
    setOpenMenuId(null)
    router.push(`/programs/${programId}/edit`)
  }

  const handleShareClick = (programId: string) => {
    setOpenMenuId(null)
    openShareModal(programId)
  }

  const handleDeleteClick = (programId: string) => {
    setOpenMenuId(null)
    deleteProgram(programId)
  }

  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  // Pagination calculations
  const totalPages = Math.ceil(recentWorkouts.length / workoutsPerPage)
  const startIndex = (workoutPage - 1) * workoutsPerPage
  const paginatedWorkouts = recentWorkouts.slice(startIndex, startIndex + workoutsPerPage)

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-50">
        <Navbar />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Dashboard</h1>
            <p className="text-zinc-600">Manage your workout programs and track your progress</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Programs Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-zinc-900">My Programs</h2>
                <Link
                  href="/programs/new"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  + New Program
                </Link>
              </div>

              {programs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center text-zinc-500">
                  No programs yet. Create your first workout program!
                </div>
              ) : (
                <div className="space-y-4">
                  {programs.map((program) => {
                    const hasUnfinishedWorkout = unfinishedWorkouts.has(program.id)

                    return (
                      <div
                        key={program.id}
                        className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition ${
                          hasUnfinishedWorkout ? 'ring-2 ring-orange-400' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xl font-semibold text-zinc-900">
                                {program.name}
                              </h3>
                              {hasUnfinishedWorkout && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                  In Progress
                                </span>
                              )}
                              {program.sharedById && program.sharedByName && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                                  Shared by {program.sharedByName}
                                </span>
                              )}
                            </div>
                            {program.description && (
                              <p className="text-zinc-600 text-sm mt-1">
                                {program.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-zinc-500 mb-4">
                          {program.exercises.length} exercises
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/workout/${program.id}`}
                            className={`flex-1 px-4 py-2 rounded transition text-center font-medium ${
                              hasUnfinishedWorkout
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-cyan-500 text-white hover:bg-cyan-600'
                            }`}
                          >
                            {hasUnfinishedWorkout ? 'Resume Workout' : 'Start Workout'}
                          </Link>
                          {hasUnfinishedWorkout && (
                            <button
                              onClick={() => discardWorkoutProgress(program.id)}
                              className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition"
                              title="Discard workout in progress"
                            >
                              Discard
                            </button>
                          )}
                          <div className="relative">
                            <button
                              onClick={(e) => toggleMenu(e, program.id)}
                              className="bg-zinc-200 text-zinc-700 px-3 py-2 rounded hover:bg-zinc-300 transition"
                              title="More options"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            {openMenuId === program.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-zinc-200 z-10">
                                <button
                                  onClick={() => handleEditClick(program.id)}
                                  className="w-full text-left px-4 py-2 hover:bg-zinc-100 text-zinc-900 rounded-t-lg transition flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleShareClick(program.id)}
                                  className="w-full text-left px-4 py-2 hover:bg-zinc-100 text-zinc-900 transition flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                  </svg>
                                  Share
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(program.id)}
                                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded-b-lg transition flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Workouts Section */}
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">
                Workout History
              </h2>

              {recentWorkouts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center text-zinc-500">
                  No workouts logged yet. Start your first workout!
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedWorkouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-zinc-900">
                              {workout.program.name}
                            </h3>
                            <p className="text-sm text-zinc-500">
                              {new Date(workout.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                              {workout.duration && (
                                <span className="ml-2 text-purple-600 font-medium">
                                  {formatDuration(workout.duration)}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm ${
                            workout.completed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {workout.completed ? 'Completed' : 'In Progress'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => setWorkoutPage(p => Math.max(1, p - 1))}
                        disabled={workoutPage === 1}
                        className="px-3 py-1 rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-zinc-600">
                        Page {workoutPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setWorkoutPage(p => Math.min(totalPages, p + 1))}
                        disabled={workoutPage === totalPages}
                        className="px-3 py-1 rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Share Modal */}
        {shareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">Share Program</h2>
              <p className="text-zinc-600 mb-4">
                Enter the email address of the user you want to share this program with. They will receive a copy they can use and modify.
              </p>

              <form onSubmit={handleShare}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-zinc-900"
                    placeholder="user@example.com"
                    required
                    disabled={shareLoading}
                  />
                </div>

                {shareError && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {shareError}
                  </div>
                )}

                {shareSuccess && (
                  <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {shareSuccess}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeShareModal}
                    className="flex-1 bg-zinc-200 text-zinc-800 py-3 rounded-lg hover:bg-zinc-300 transition font-medium"
                    disabled={shareLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={shareLoading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {shareLoading ? "Sharing..." : "Share Program"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}//test
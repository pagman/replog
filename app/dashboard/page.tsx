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
}

interface Workout {
  id: string
  date: string
  program: {
    name: string
  }
  completed: boolean
}

export default function Dashboard() {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [unfinishedWorkouts, setUnfinishedWorkouts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
    checkUnfinishedWorkouts()
  }, [])

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
      setRecentWorkouts(workoutsData.slice(0, 5))
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
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-semibold text-zinc-900">
                                {program.name}
                              </h3>
                              {hasUnfinishedWorkout && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                  In Progress
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
                          <button
                            onClick={() => deleteProgram(program.id)}
                            className="bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent Workouts Section */}
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">
                Recent Workouts
              </h2>

              {recentWorkouts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center text-zinc-500">
                  No workouts logged yet. Start your first workout!
                </div>
              ) : (
                <div className="space-y-4">
                  {recentWorkouts.map((workout) => (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}//test
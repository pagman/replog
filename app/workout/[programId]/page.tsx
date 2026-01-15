"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import Navbar from "@/components/Navbar"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
}

interface Program {
  id: string
  name: string
  exercises: Exercise[]
}

interface WorkoutSet {
  exerciseName: string
  setNumber: number
  reps: number
  weight: number
  completed: boolean
}

interface PreviousSet {
  exerciseName: string
  setNumber: number
  reps: number
  weight: number
}

interface PreviousWorkout {
  date: string
  sets: PreviousSet[]
}

export default function WorkoutPage() {
  const params = useParams()
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([])
  const [previousWorkout, setPreviousWorkout] = useState<PreviousWorkout | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasResumedProgress, setHasResumedProgress] = useState(false)
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Initialize workout start time
  useEffect(() => {
    const savedStartTime = localStorage.getItem(`workout-start-${params.programId}`)
    if (savedStartTime) {
      setWorkoutStartTime(parseInt(savedStartTime))
    } else {
      const now = Date.now()
      setWorkoutStartTime(now)
      localStorage.setItem(`workout-start-${params.programId}`, now.toString())
    }
  }, [params.programId])

  // Update elapsed time every second
  useEffect(() => {
    if (!workoutStartTime) return

    const updateElapsed = () => {
      setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000))
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [workoutStartTime])

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    fetchData()
  }, [params.programId])

  // Save workout progress to localStorage whenever it changes
  useEffect(() => {
    if (program && workoutSets.length > 0) {
      const progressData = {
        sets: workoutSets,
        notes,
        timestamp: Date.now()
      }
      localStorage.setItem(`workout-progress-${params.programId}`, JSON.stringify(progressData))
    }
  }, [workoutSets, notes, params.programId, program])

  const fetchData = async () => {
    try {
      // Fetch program
      const programsResponse = await fetch("/api/programs")
      const programs = await programsResponse.json()
      const found = programs.find((p: Program) => p.id === params.programId)
      
      if (!found) {
        router.push("/dashboard")
        return
      }

      setProgram(found)

      // Fetch previous workouts for this program
      const workoutsResponse = await fetch(`/api/workouts?programId=${params.programId}`)
      const workouts = await workoutsResponse.json()

      if (workouts.length > 0) {
        // Get the most recent workout
        const lastWorkout = workouts[0]
        setPreviousWorkout({
          date: lastWorkout.date,
          sets: lastWorkout.sets
        })
      }

      initializeWorkoutSets(found)
    } catch (error) {
      console.error("Error fetching data:", error)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const initializeWorkoutSets = (program: Program) => {
    // Check for saved progress first
    const savedProgress = localStorage.getItem(`workout-progress-${params.programId}`)

    if (savedProgress) {
      try {
        const { sets, notes: savedNotes, timestamp } = JSON.parse(savedProgress)
        // Only restore if the saved progress is less than 24 hours old
        const hoursSinceSave = (Date.now() - timestamp) / (1000 * 60 * 60)
        if (hoursSinceSave < 24) {
          setWorkoutSets(sets)
          setNotes(savedNotes || "")
          setHasResumedProgress(true)
          return
        } else {
          // Clear old saved progress
          localStorage.removeItem(`workout-progress-${params.programId}`)
        }
      } catch (error) {
        console.error("Error loading saved progress:", error)
      }
    }

    // Initialize fresh workout sets if no saved progress
    const sets: WorkoutSet[] = []

    program.exercises.forEach((exercise) => {
      for (let i = 1; i <= exercise.sets; i++) {
        sets.push({
          exerciseName: exercise.name,
          setNumber: i,
          reps: exercise.reps,
          weight: 0,
          completed: false
        })
      }
    })

    setWorkoutSets(sets)
  }

  const getPreviousSetData = (exerciseName: string, setNumber: number): PreviousSet | undefined => {
    return previousWorkout?.sets.find(
      s => s.exerciseName === exerciseName && s.setNumber === setNumber
    )
  }

  const updateSet = (index: number, field: keyof WorkoutSet, value: number | boolean) => {
    const updated = [...workoutSets]
    updated[index] = { ...updated[index], [field]: value }
    setWorkoutSets(updated)
  }

  const toggleSetComplete = (index: number) => {
    const updated = [...workoutSets]
    updated[index].completed = !updated[index].completed
    setWorkoutSets(updated)
  }

  const copyPreviousWeight = (index: number, exerciseName: string, setNumber: number) => {
    const previousSet = getPreviousSetData(exerciseName, setNumber)
    if (previousSet) {
      const updated = [...workoutSets]
      updated[index].weight = previousSet.weight
      updated[index].reps = previousSet.reps
      setWorkoutSets(updated)
    }
  }

  const handleDiscardProgress = () => {
    if (confirm("Are you sure you want to discard your saved progress and start fresh?")) {
      localStorage.removeItem(`workout-progress-${params.programId}`)
      localStorage.removeItem(`workout-start-${params.programId}`)
      setHasResumedProgress(false)
      // Reset timer
      const now = Date.now()
      setWorkoutStartTime(now)
      localStorage.setItem(`workout-start-${params.programId}`, now.toString())
      if (program) {
        initializeWorkoutSets(program)
        setNotes("")
      }
    }
  }

  const handleCancel = () => {
    // Check if there's any progress to lose
    const hasProgress = workoutSets.some(set => set.completed || set.weight > 0)

    if (hasProgress) {
      // Ask user if they want to keep progress or discard it
      const shouldDiscard = confirm(
        "Do you want to discard your workout progress?\n\n" +
        "• Click OK to discard progress and return to dashboard\n" +
        "• Click Cancel to keep progress saved and return to dashboard"
      )

      if (shouldDiscard) {
        localStorage.removeItem(`workout-progress-${params.programId}`)
        localStorage.removeItem(`workout-start-${params.programId}`)
      }
    }

    router.push("/dashboard")
  }

  const handleSaveWorkout = async () => {
    if (workoutSets.some(set => set.weight === 0)) {
      if (!confirm("Some sets have 0 weight. Continue saving?")) {
        return
      }
    }

    setSaving(true)

    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programId: params.programId,
          sets: workoutSets,
          notes,
          completed: true,
          duration: elapsedTime
        }),
      })

      if (response.ok) {
        // Clear saved progress and timer after successful save
        localStorage.removeItem(`workout-progress-${params.programId}`)
        localStorage.removeItem(`workout-start-${params.programId}`)
        router.push("/dashboard")
      } else {
        alert("Failed to save workout")
      }
    } catch (error) {
      console.error("Error saving workout:", error)
      alert("Something went wrong")
    } finally {
      setSaving(false)
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

  if (!program) {
    return null
  }

  const exerciseGroups = program.exercises.map((exercise) => ({
    exercise,
    sets: workoutSets.filter(set => set.exerciseName === exercise.name)
  }))

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-50">
        {/* Fixed Header - Navbar and Timer always visible at top */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
          <div className="bg-purple-700 text-white py-2 shadow-md">
            <div className="container mx-auto px-4 max-w-4xl flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-semibold tabular-nums">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Spacer for fixed header (navbar h-16 + timer ~h-10) */}
        <div className="h-[104px]"></div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-purple-600 hover:text-purple-800 mb-4"
            >
              ← Back to Dashboard
            </button>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                {program.name}
              </h1>
              <p className="text-zinc-600">
                Log your sets, reps, and weights for each exercise
              </p>
              {hasResumedProgress && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Workout progress restored - picking up where you left off!
                    </p>
                    <button
                      onClick={handleDiscardProgress}
                      className="text-xs text-green-700 hover:text-green-900 underline"
                    >
                      Start Fresh
                    </button>
                  </div>
                </div>
              )}
              {previousWorkout && (
                <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded">
                  <p className="text-sm text-cyan-800">
                    📊 Last workout: {new Date(previousWorkout.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {exerciseGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">
                  {group.exercise.name}
                </h2>
                <p className="text-sm text-zinc-600 mb-4">
                  Target: {group.exercise.sets} sets × {group.exercise.reps} reps
                </p>

                <div className="space-y-3">
                  {group.sets.map((set, setIndex) => {
                    const absoluteIndex = workoutSets.findIndex(
                      s => s.exerciseName === set.exerciseName && s.setNumber === set.setNumber
                    )
                    const previousSet = getPreviousSetData(set.exerciseName, set.setNumber)

                    return (
                      <div
                        key={setIndex}
                        className={`border rounded-lg p-4 transition ${
                          set.completed
                            ? 'border-green-400 bg-green-50'
                            : 'border-zinc-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 pt-7">
                            <button
                              type="button"
                              onClick={() => toggleSetComplete(absoluteIndex)}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                                set.completed
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : 'border-zinc-300 hover:border-purple-500'
                              }`}
                            >
                              {set.completed && '✓'}
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <span className="text-sm font-medium text-zinc-700">
                                Set {set.setNumber}
                              </span>
                            </div>

                            <div className="space-y-3 mb-3">
                              <div>
                                <label className="block text-xs text-zinc-600 mb-1">
                                  Reps {previousSet && (
                                    <span className="text-cyan-600">(Last: {previousSet.reps})</span>
                                  )}
                                </label>
                                <div className="flex items-center gap-2 w-full">
                                  <button
                                    type="button"
                                    onClick={() => updateSet(absoluteIndex, "reps", Math.max(0, set.reps - 1))}
                                    className="shrink-0 w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 border border-zinc-300 rounded text-zinc-700 font-bold text-lg"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    value={set.reps === 0 ? '' : set.reps}
                                    onChange={(e) => updateSet(absoluteIndex, "reps", e.target.value === '' ? 0 : parseInt(e.target.value))}
                                    className="min-w-0 flex-1 px-3 py-2 border border-zinc-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900 text-center text-lg"
                                    min="0"
                                    placeholder="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateSet(absoluteIndex, "reps", set.reps + 1)}
                                    className="shrink-0 w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 border border-zinc-300 rounded text-zinc-700 font-bold text-lg"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-600 mb-1">
                                  Weight (kg/lbs) {previousSet && (
                                    <span className="text-cyan-600">(Last: {previousSet.weight})</span>
                                  )}
                                </label>
                                <div className="flex items-center gap-2 w-full">
                                  <button
                                    type="button"
                                    onClick={() => updateSet(absoluteIndex, "weight", Math.max(0, set.weight -1))}
                                    className="shrink-0 w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 border border-zinc-300 rounded text-zinc-700 font-bold text-lg"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    value={set.weight === 0 ? '' : set.weight}
                                    onChange={(e) => updateSet(absoluteIndex, "weight", e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    className="min-w-0 flex-1 px-3 py-2 border border-zinc-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900 text-center text-lg"
                                    min="0"
                                    step="0.5"
                                    placeholder="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateSet(absoluteIndex, "weight", set.weight + 1)}
                                    className="shrink-0 w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 border border-zinc-300 rounded text-zinc-700 font-bold text-lg"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>

                            {previousSet && (
                              <button
                                type="button"
                                onClick={() => copyPreviousWeight(absoluteIndex, set.exerciseName, set.setNumber)}
                                className="w-full text-xs bg-cyan-100 text-cyan-700 px-3 py-2 rounded hover:bg-cyan-200 transition"
                              >
                                Copy Last
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-zinc-900 mb-4">
                Workout Notes (Optional)
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900"
                rows={4}
                placeholder="How did the workout feel? Any observations?"
              />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-zinc-200 text-zinc-800 py-3 rounded-lg hover:bg-zinc-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveWorkout}
                  disabled={saving}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? "Saving..." : "Complete Workout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
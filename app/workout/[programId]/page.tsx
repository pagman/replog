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

  useEffect(() => {
    fetchData()
  }, [params.programId])

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
          completed: true
        }),
      })

      if (response.ok) {
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Dashboard
            </button>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {program.name}
              </h1>
              <p className="text-gray-600">
                Log your sets, reps, and weights for each exercise
              </p>
              {previousWorkout && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
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
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {group.exercise.name}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
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
                            : 'border-gray-200'
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
                                  : 'border-gray-300 hover:border-blue-500'
                              }`}
                            >
                              {set.completed && '✓'}
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Set {set.setNumber}
                              </span>
                            </div>

                            <div className="space-y-3 mb-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Reps {previousSet && (
                                    <span className="text-blue-600">(Last: {previousSet.reps})</span>
                                  )}
                                </label>
                                <div className="flex items-center gap-2 w-full">
                                  <button
                                    type="button"
                                    onClick={() => updateSet(absoluteIndex, "reps", Math.max(0, set.reps - 1))}
                                    className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 border border-gray-300 rounded text-gray-700 font-bold text-lg"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    value={set.reps === 0 ? '' : set.reps}
                                    onChange={(e) => updateSet(absoluteIndex, "reps", e.target.value === '' ? 0 : parseInt(e.target.value))}
                                    className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-center text-lg"
                                    min="0"
                                    placeholder="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateSet(absoluteIndex, "reps", set.reps + 1)}
                                    className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 border border-gray-300 rounded text-gray-700 font-bold text-lg"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Weight (kg/lbs) {previousSet && (
                                    <span className="text-blue-600">(Last: {previousSet.weight})</span>
                                  )}
                                </label>
                                <div className="flex items-center gap-2 w-full">
                                  <button
                                    type="button"
                                    onClick={() => updateSet(absoluteIndex, "weight", Math.max(0, set.weight - 5))}
                                    className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 border border-gray-300 rounded text-gray-700 font-bold text-lg"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    value={set.weight === 0 ? '' : set.weight}
                                    onChange={(e) => updateSet(absoluteIndex, "weight", e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-center text-lg"
                                    min="0"
                                    step="0.5"
                                    placeholder="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateSet(absoluteIndex, "weight", set.weight + 5)}
                                    className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 border border-gray-300 rounded text-gray-700 font-bold text-lg"
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
                                className="w-full text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 transition"
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
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Workout Notes (Optional)
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                rows={4}
                placeholder="How did the workout feel? Any observations?"
              />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveWorkout}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
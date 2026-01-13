"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import Navbar from "@/components/Navbar"

interface Exercise {
  name: string
  sets: number
  reps: number
}

export default function EditProgram() {
  const router = useRouter()
  const params = useParams()
  const programId = params.id as string

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", sets: 3, reps: 10 }
  ])
  const [loading, setLoading] = useState(false)
  const [loadingProgram, setLoadingProgram] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadProgram = async () => {
      try {
        const response = await fetch("/api/programs")
        if (!response.ok) {
          throw new Error("Failed to load programs")
        }

        const programs = await response.json()
        const program = programs.find((p: { id: string }) => p.id === programId)

        if (!program) {
          setError("Program not found")
          return
        }

        setName(program.name)
        setDescription(program.description || "")
        setExercises(program.exercises.map((ex: { name: string; sets: number; reps: number }) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps
        })))
      } catch (error) {
        setError("Failed to load program")
      } finally {
        setLoadingProgram(false)
      }
    }

    loadProgram()
  }, [programId])

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: 10 }])
  }

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index))
    }
  }

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Program name is required")
      return
    }

    if (exercises.some(ex => !ex.name.trim())) {
      setError("All exercises must have a name")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          exercises
        }),
      })

      if (response.ok) {
        router.push("/dashboard")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update program")
      }
    } catch (error) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (loadingProgram) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-zinc-50">
          <Navbar />
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="text-center text-zinc-600">Loading program...</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-50">
        <Navbar />

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Edit Program</h1>
            <p className="text-zinc-600">Update your workout program</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Program Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900"
                placeholder="e.g., Upper Body Day, Leg Day"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900"
                rows={3}
                placeholder="Brief description of this program..."
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-zinc-700">
                  Exercises *
                </label>
                <button
                  type="button"
                  onClick={addExercise}
                  className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition text-sm"
                >
                  + Add Exercise
                </button>
              </div>

              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="border border-zinc-200 rounded-lg p-4 bg-zinc-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-zinc-600">
                        Exercise {index + 1}
                      </span>
                      {exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExercise(index)}
                          className="text-rose-500 hover:text-rose-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(e) => updateExercise(index, "name", e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900"
                        placeholder="Exercise name (e.g., Bench Press, Squats)"
                        required
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-zinc-600 mb-1">
                            Target Sets
                          </label>
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(index, "sets", parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900"
                            min="1"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-600 mb-1">
                            Target Reps
                          </label>
                          <input
                            type="number"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(index, "reps", parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-900"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-zinc-200 text-zinc-800 py-3 rounded-lg hover:bg-zinc-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Updating..." : "Update Program"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}

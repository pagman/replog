import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"

interface WorkoutSetInput {
  exerciseName: string
  setNumber: number
  reps: number
  weight: number
  completed: boolean
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')

    const where: { userId: string; programId?: string } = {
      userId: session.user.id
    }

    if (programId) {
      where.programId = programId
    }

    const workouts = await prisma.workout.findMany({
      where,
      include: {
        program: true,
        sets: {
          orderBy: {
            setNumber: 'asc'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(workouts)
  } catch (error) {
    console.error("Get workouts error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { programId, sets, notes, completed } = body as {
      programId: string
      sets: WorkoutSetInput[]
      notes?: string
      completed?: boolean
    }

    if (!programId || !sets || sets.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const workout = await prisma.workout.create({
      data: {
        programId,
        userId: session.user.id,
        notes,
        completed: completed || true,
        sets: {
          create: sets.map((set) => ({
            exerciseName: set.exerciseName,
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            completed: set.completed !== false
          }))
        }
      },
      include: {
        sets: true,
        program: true
      }
    })

    return NextResponse.json(workout, { status: 201 })
  } catch (error) {
    console.error("Create workout error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
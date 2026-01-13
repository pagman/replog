import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"

interface ExerciseInput {
  name: string
  sets: number
  reps: number
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify ownership
    const existingProgram = await prisma.program.findUnique({
      where: { id }
    })

    if (!existingProgram || existingProgram.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, exercises } = body as {
      name: string
      description?: string
      exercises: ExerciseInput[]
    }

    if (!name || !exercises || exercises.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Delete existing exercises and create new ones
    // This is simpler than trying to match and update individual exercises
    const program = await prisma.program.update({
      where: { id },
      data: {
        name,
        description,
        exercises: {
          deleteMany: {},
          create: exercises.map((exercise, index) => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            order: index
          }))
        }
      },
      include: {
        exercises: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(program)
  } catch (error) {
    console.error("Update program error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

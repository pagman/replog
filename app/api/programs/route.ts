import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const programs = await prisma.program.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        exercises: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(programs)
  } catch (error) {
    console.error("Get programs error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

interface ExerciseInput {
  name: string
  sets: number
  reps: number
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

    const program = await prisma.program.create({
      data: {
        name,
        description,
        userId: session.user.id,
        exercises: {
          create: exercises.map((exercise, index) => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            order: index
          }))
        }
      },
      include: {
        exercises: true
      }
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error("Create program error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Program ID required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const program = await prisma.program.findUnique({
      where: { id }
    })

    if (!program || program.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

    await prisma.program.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete program error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
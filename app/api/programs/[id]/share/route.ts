import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
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
    const body = await request.json()
    const { email } = body as { email: string }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Verify the program exists and belongs to the user
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        exercises: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!program || program.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      )
    }

    // Find the recipient user by email
    const recipient = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: "User with this email not found" },
        { status: 404 }
      )
    }

    if (recipient.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot share a program with yourself" },
        { status: 400 }
      )
    }

    // Create a copy of the program for the recipient
    const sharedProgram = await prisma.program.create({
      data: {
        name: program.name,
        description: program.description,
        userId: recipient.id,
        sharedById: session.user.id,
        sharedByName: session.user.name || session.user.email,
        exercises: {
          create: program.exercises.map((exercise) => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            order: exercise.order
          }))
        }
      },
      include: {
        exercises: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Program shared with ${email}`,
      sharedProgram
    })
  } catch (error) {
    console.error("Share program error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

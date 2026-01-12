"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path ? "bg-blue-700" : ""
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-2xl font-bold">
            RepLog 💪
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded hover:bg-blue-700 transition ${isActive('/dashboard')}`}
            >
              Dashboard
            </Link>
            <Link
              href="/programs/new"
              className={`px-4 py-2 rounded hover:bg-blue-700 transition ${isActive('/programs/new')}`}
            >
              New Program
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 bg-red-500 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
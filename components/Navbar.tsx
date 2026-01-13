"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path ? "bg-purple-700" : ""
  }

  return (
    <nav className="bg-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-lg sm:text-2xl font-bold whitespace-nowrap">
            RepLog 💪
          </Link>

          <div className="flex items-center gap-1 sm:gap-4">
            <Link
              href="/dashboard"
              className={`px-2 sm:px-4 py-2 text-sm sm:text-base rounded hover:bg-purple-700 transition ${isActive('/dashboard')}`}
            >
              Dashboard
            </Link>
            <Link
              href="/programs/new"
              className={`px-2 sm:px-4 py-2 text-sm sm:text-base rounded hover:bg-purple-700 transition whitespace-nowrap ${isActive('/programs/new')}`}
            >
              New Program
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-2 sm:px-4 py-2 text-sm sm:text-base bg-rose-500 rounded hover:bg-rose-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
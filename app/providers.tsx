"use client"

import { SessionProvider, signOut, useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if session is expired and redirect to login
    if (status === "authenticated" && (session as any)?.expired) {
      signOut({ redirect: false }).then(() => {
        router.push("/")
      })
    }

    // Handle case where session becomes unauthenticated on protected routes
    if (status === "unauthenticated" && pathname !== "/") {
      router.push("/")
    }
  }, [session, status, router, pathname])

  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
      refetchInterval={5 * 60} // Refetch session every 5 minutes
    >
      <SessionGuard>{children}</SessionGuard>
    </SessionProvider>
  )
}
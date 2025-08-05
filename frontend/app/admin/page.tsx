// // app/admin/page.tsx
// "use client"

// import { useAuth } from "@/contexts/auth-context"
// import AdminPanel from "@/components/admin-panel"
// import { useRouter } from "next/navigation"
// import { useEffect } from "react"

// export default function AdminPage() {
//   const { admin, loading } = useAuth()
//   const router = useRouter()

//   useEffect(() => {
//     if (!loading && !admin) {
//       router.push("/")  // Redirect to login if not admin
//     }
//   }, [admin, loading, router])

//   if (loading || !admin) {
//     return <div className="p-4">Loading...</div>
//   }

//   return (
//     <main className="p-4">
//       <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Panel</h1>
//       <AdminPanel />
//     </main>
//   )
// }
"use client"

import { useAuth } from "@/contexts/auth-context"
import AdminPanel from "@/components/admin-panel"
import AdminLogin from "@/components/admin-login"  // 👈 Your login form
import { useEffect } from "react"

export default function AdminPage() {
  const { admin, loading } = useAuth()

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <main className="p-4">
      {admin ? (
        <>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Panel</h1>
          <AdminPanel />
        </>
      ) : (
        <AdminLogin />
      )}
    </main>
  )
}

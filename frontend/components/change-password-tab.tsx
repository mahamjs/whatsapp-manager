// "use client"

// import { useState } from "react"
// import { Card, CardContent } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { Label } from "@/components/ui/label"
// import { useAuth } from "@/contexts/auth-context"

// export default function ChangePasswordTab() {
//   const { user } = useAuth()
//   const [oldPassword, setOldPassword] = useState("")
//   const [newPassword, setNewPassword] = useState("")
//   const [message, setMessage] = useState("")
//   const [loading, setLoading] = useState(false)

//   const handleSubmit = async () => {
//     setMessage("")
//     setLoading(true)
//     try {
//       const res = await fetch("/profile/change_password", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${user?.token}`,
//         },
//         body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
//       })

//       const result = await res.json()
//       if (!res.ok) throw new Error(result.error || "Password change failed")
//       setMessage("✅ Password changed successfully.")
//       setOldPassword("")
//       setNewPassword("")
//     } catch (err: any) {
//       setMessage(`❌ ${err.message}`)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Card className="max-w-md mx-auto">
//       <CardContent className="space-y-4 py-6">
//         <h2 className="text-xl font-semibold">Change Password</h2>

//         <div className="space-y-2">
//           <Label>Old Password</Label>
//           <Input
//             type="password"
//             value={oldPassword}
//             onChange={(e) => setOldPassword(e.target.value)}
//           />
//         </div>

//         <div className="space-y-2">
//           <Label>New Password</Label>
//           <Input
//             type="password"
//             value={newPassword}
//             onChange={(e) => setNewPassword(e.target.value)}
//           />
//         </div>

//         <Button onClick={handleSubmit} disabled={loading} className="w-full">
//           {loading ? "Updating..." : "Update Password"}
//         </Button>

//         {message && <p className="text-sm text-muted-foreground">{message}</p>}
//       </CardContent>
//     </Card>
//   )
// }

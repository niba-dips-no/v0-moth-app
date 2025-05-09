import { AdminDashboard } from "@/components/admin/dashboard"

export default function AdminPage() {
  // In a real app, you would check for authentication here
  // For now, we'll just render the dashboard
  // If not authenticated, you would redirect to login
  // redirect('/admin/login')

  return <AdminDashboard />
}

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/users/UserManagement";
import SiteManagement from "./pages/sites/SiteManagement";
import PatrolLogs from "./pages/logs/PatrolLogs";
import VisitLogs from "./pages/logs/VisitLogs";
import IssueTracker from "./pages/issues/IssueTracker";
import PatrolPoints from "./pages/points/PatrolPoints";
import Settings from "./pages/settings/Settings";
import { useUser, RedirectToSignIn } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Toaster } from "sonner";

const Analytics = () => <Dashboard />;

function ProtectedRoute({ children, permission }: { children: React.ReactNode, permission?: string }) {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  if (!isLoaded) return <div className="h-screen w-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  if (!user) return <RedirectToSignIn />;

  if (permission && currentUser) {
    if (currentUser.role === "Owner") return <>{children}</>;
    const hasPermission = (currentUser.permissions as any)?.[permission];
    if (!hasPermission) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <div className="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute permission="users"><UserManagement /></ProtectedRoute>} />
          <Route path="/sites" element={<ProtectedRoute permission="sites"><SiteManagement /></ProtectedRoute>} />
          <Route path="/patrol-logs" element={<ProtectedRoute permission="patrolLogs"><PatrolLogs /></ProtectedRoute>} />
          <Route path="/visit-logs" element={<ProtectedRoute permission="visitLogs"><VisitLogs /></ProtectedRoute>} />
          <Route path="/issues" element={<ProtectedRoute permission="issues"><IssueTracker /></ProtectedRoute>} />
          <Route path="/patrol-points" element={<ProtectedRoute permission="patrolPoints"><PatrolPoints /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute permission="analytics"><Analytics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors theme="dark" />
    </div>
  );
}

export default App;

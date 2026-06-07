import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./store";

import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTeachers from "./pages/admin/Teachers";
import AdminStudents from "./pages/admin/Students";
import AdminCourses from "./pages/admin/Courses";
import AdminSchedules from "./pages/admin/Schedules";
import AdminScheduleCalendarPage from "./pages/admin/ScheduleCalendarPage";
import AdminLessons from "./pages/admin/Lessons";
import AdminReports from "./pages/admin/Reports";
import TeacherSchedule from "./pages/teacher/Schedule";
import TeacherScheduleCalendarPage from "./pages/teacher/ScheduleCalendarPage";
import TeacherStudents from "./pages/teacher/Students";
import TeacherCheckin from "./pages/teacher/Checkin";
import ParentProfile from "./pages/parent/Profile";
import ParentSchedule from "./pages/parent/Schedule";
import ParentLessons from "./pages/parent/Lessons";
import ParentComments from "./pages/parent/Comments";

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  const { user } = useStore();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            user ? 
              (user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : 
               user.role === 'teacher' ? <Navigate to="/teacher/schedule" replace /> : 
               <Navigate to="/parent/profile" replace />) : 
              <Login />
          } 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTeachers /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudents /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourses /></ProtectedRoute>} />
        <Route path="/admin/schedules" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSchedules /></ProtectedRoute>} />
        <Route path="/admin/schedule-calendar" element={<ProtectedRoute allowedRoles={["admin"]}><AdminScheduleCalendarPage /></ProtectedRoute>} />
        <Route path="/admin/lessons" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLessons /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />

        <Route path="/teacher/schedule" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherSchedule /></ProtectedRoute>} />
        <Route path="/teacher/schedule-calendar" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherScheduleCalendarPage /></ProtectedRoute>} />
        <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherStudents /></ProtectedRoute>} />
        <Route path="/teacher/checkin" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherCheckin /></ProtectedRoute>} />

        <Route path="/parent/profile" element={<ProtectedRoute allowedRoles={["parent"]}><ParentProfile /></ProtectedRoute>} />
        <Route path="/parent/schedule" element={<ProtectedRoute allowedRoles={["parent"]}><ParentSchedule /></ProtectedRoute>} />
        <Route path="/parent/lessons" element={<ProtectedRoute allowedRoles={["parent"]}><ParentLessons /></ProtectedRoute>} />
        <Route path="/parent/comments" element={<ProtectedRoute allowedRoles={["parent"]}><ParentComments /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

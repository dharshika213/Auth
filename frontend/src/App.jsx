import { BrowserRouter, Routes, Route } from "react-router-dom"

import LandingPage from "./pages/LandingPage"
import WelcomePage from "./pages/WelcomePage"
import RoleSelectionPage from "./pages/RoleSelectionPage"
import AuthPage from "./pages/AuthPage"
import StudentDashboard from "./pages/StudentDashboard"
import TeacherDashboard from "./pages/TeacherDashboard"
import VerificationReport from "./pages/VerificationReport"
import AssignmentTracking from "./pages/AssignmentTracking"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/roles" element={<RoleSelectionPage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route path="/student" element={<StudentDashboard />} />

        <Route path="/teacher" element={<TeacherDashboard />} />

        <Route
          path="/teacher/report/:submissionId"
          element={<VerificationReport />}
        />

        <Route
          path="/teacher/assignment/:assignmentId/tracking"
          element={<AssignmentTracking />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
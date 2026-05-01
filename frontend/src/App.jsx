import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import TakeExamScreen from './pages/TakeExamScreen';
import TeacherDashboardScreen from './pages/TeacherDashboardScreen';
import PrivateRoute from './components/PrivateRoute';
import VerifyFace from './pages/VerifyFace';
import ManageExams from './pages/ManageExams';
import ActiveExams from './pages/ActiveExams';
import StudentReports from './pages/StudentReports';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import Results from './pages/Results';

const RoleBasedRedirect = () => {
  const { userInfo } = useSelector((state) => state.auth);
  if (!userInfo) return <Navigate to="/login" replace />;
  
  return userInfo.role === 'teacher' ? (
    <Navigate to="/teacher/dashboard" replace />
  ) : (
    <Navigate to="/student/dashboard" replace />
  );
};

const RoleRoute = ({ allowedRole, children }) => {
  const { userInfo } = useSelector((state) => state.auth);
  if (!userInfo) return <Navigate to="/login" replace />;
  if (userInfo.role !== allowedRole) {
    return <RoleBasedRedirect />;
  }
  return children ? children : <Outlet />;
};

const App = () => {
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <>
      {!userInfo && <Header />}
      <main style={userInfo ? {} : { minHeight: '80vh', padding: '2rem' }}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          
          <Route path="/" element={<PrivateRoute />}>
            <Route index element={<RoleBasedRedirect />} />
            
            {/* Student Routes */}
            <Route element={<RoleRoute allowedRole="student" />}>
              <Route element={<Layout />}>
                <Route path="student/dashboard" element={<Dashboard />} />
                <Route path="exams" element={<Exams />} />
                <Route path="results" element={<Results />} />
              </Route>
              <Route path="verify-face" element={<VerifyFace />} />
              <Route path="exam/:id" element={<TakeExamScreen />} />
            </Route>

            {/* Teacher Routes */}
            <Route element={<RoleRoute allowedRole="teacher" />}>
              <Route path="teacher/dashboard" element={<TeacherDashboardScreen />} />
              <Route path="teacher/manage-exams" element={<ManageExams />} />
              <Route path="teacher/active-exams" element={<ActiveExams />} />
              <Route path="teacher/student-reports" element={<StudentReports />} />
            </Route>
            
          </Route>
        </Routes>
      </main>
    </>
  );
};

export default App;

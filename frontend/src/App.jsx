import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import DashboardScreen from './pages/DashboardScreen';
import TakeExamScreen from './pages/TakeExamScreen';
import TeacherDashboardScreen from './pages/TeacherDashboardScreen';
import PrivateRoute from './components/PrivateRoute';
import VerifyFace from './pages/VerifyFace';
import ManageExams from './pages/ManageExams';
import ActiveExams from './pages/ActiveExams';
import StudentReports from './pages/StudentReports';

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
            <Route path="" element={<DashboardScreen />} />
            <Route path="verify-face" element={<VerifyFace />} />
            <Route path="exam/:id" element={<TakeExamScreen />} />
            <Route path="teacher" element={<TeacherDashboardScreen />} />
            <Route path="teacher/manage-exams" element={<ManageExams />} />
            <Route path="teacher/active-exams" element={<ActiveExams />} />
            <Route path="teacher/student-reports" element={<StudentReports />} />
          </Route>
        </Routes>
      </main>
    </>
  );
};

export default App;

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import LoginPage from './components/LoginForm';
import SelectRolePage from './components/RoleSelect';
import RegisterForm from './components/RegisterForm';
import GroupsVoidPage from './components/GroupsVoidPage';
import GroupsTeacherPage from './components/GroupsTeacherPage';
import PostPage from './components/PostPage';
import GroupPage from './components/GroupPage';
import NotificationsBellPage from './components/NotificationsBellPage';
import GroupStudentPage from './components/GroupStudentPage';

function App() {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    // Защищенный маршрут для профиля
    const ProtectedRoute = ({ children }) => {
        if (!user) {
            return <Navigate to="/login" />;
        }
        return children;
    };

    return (
        <Router>
            <div className="min-h-screen bg-blue-50">
                <Routes>
                    <Route path="/" element={<HomePage user={user} />} />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage user={user} onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/login"
                        element={<LoginPage onLogin={handleLogin} />}
                    />
                    <Route path="/select-role" element={<SelectRolePage />} />
                    <Route path="/register/:role" element={<RegisterForm onLogin={handleLogin} />} />
                    <Route
                        path="/groups"
                        element={
                            user
                                ? (user.role === 'teacher'
                                    ? <GroupsTeacherPage />
                                    : user.role === 'student'
                                        ? <GroupStudentPage />
                                        : <div>Заглушка для других ролей</div>)
                                : <GroupsVoidPage />
                        }
                    />
                    <Route path="/groups/:groupId/post/:postId" element={<PostPage />} />
                    <Route path="/groups/:groupId" element={<GroupPage />} />
                    <Route path="/notifications" element={<NotificationsBellPage />} />
                    <Route
                        path="/users/:userId"
                        element={
                            <ProtectedRoute>
                                <ProfilePage user={user} onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App; 
// frontend/src/components/ProfilePage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { authService } from '../services/authService';
import { getNotifications, getUserProfile } from '../services/api';

const ROLE_LABELS = {
    student: "Студент",
    teacher: "Преподаватель",
    admin: "Администратор"
};

const ProfilePage = ({ user: currentUser, onLogout }) => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const isOwnProfile = !userId || userId === currentUser?.id;

    const [profileData, setProfileData] = useState({
        fullName: "",
        email: "",
        about: "",
        role: "",
        groups: []
    });
    const [originalProfile, setOriginalProfile] = useState(profileData);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);
    const [notifCount, setNotifCount] = useState(Number(localStorage.getItem('notifCount') || 0));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                setLoading(true);
                const id = userId || currentUser?.id;
                const data = await getUserProfile(id);
                setProfileData({
                    fullName: data.fullName || data.name || "",
                    email: data.email,
                    about: data.about || "",
                    role: data.role,
                    groups: data.groups || []
                });
                setOriginalProfile({
                    fullName: data.fullName || data.name || "",
                    email: data.email,
                    about: data.about || "",
                    role: data.role,
                    groups: data.groups || []
                });
            } catch (e) {
                setError('Ошибка загрузки профиля');
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [userId, currentUser]);

    useEffect(() => {
        async function fetchNotifCount() {
            try {
                const notifs = await getNotifications();
                const pending = notifs.filter(n => n.status === 'pending').length;
                setNotifCount(pending);
                localStorage.setItem('notifCount', String(pending));
            } catch {
                setNotifCount(0);
                localStorage.setItem('notifCount', '0');
            }
        }
        fetchNotifCount();
    }, []);

    useEffect(() => {
        const onStorage = () => {
            setNotifCount(Number(localStorage.getItem('notifCount') || 0));
        };
        window.addEventListener('storage', onStorage);
        window.addEventListener('notifCountUpdate', onStorage);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('notifCountUpdate', onStorage);
        };
    }, []);

    const handleSave = async () => {
        if (!isOwnProfile) return;

        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email)) {
            setError('Некорректный email');
            return;
        }
        try {
            const updatedUser = await authService.updateProfile(profileData);
            setIsEditing(false);
            setError(null);
            setOriginalProfile({ ...profileData });
        } catch (error) {
            if (error.data && error.data.email) {
                let msg = error.data.email[0];
                if (
                    msg === "This field must be unique." ||
                    msg === "user with this email already exists." ||
                    msg === "A user with that email already exists."
                ) {
                    msg = "Пользователь с таким email уже существует";
                }
                setError(msg);
            } else {
                setError('Ошибка при сохранении профиля');
            }
        }
    };

    const handleEdit = () => {
        if (!isOwnProfile) return;
        setIsEditing(true);
        setOriginalProfile({ ...profileData });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setProfileData({ ...originalProfile });
        setError(null);
    };

    const handleLogout = async () => {
        await onLogout();
        navigate("/");
    };

    const handleBellClick = () => {
        setNotifCount(0);
        localStorage.setItem('notifCount', '0');
        navigate('/notifications');
    };

    if (loading) return <div className="text-center py-10">Загрузка...</div>;

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white shadow-md px-2 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600 mb-2 sm:mb-0">TaskTalk</Link>
                <nav className="space-x-0 sm:space-x-6 flex flex-col sm:flex-row items-center">
                    <Link to="/" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Главная</Link>
                    <Link to="/profile" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Профиль</Link>
                    <Link to="/groups" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Группы</Link>
                    <a href="#" className="text-gray-700 hover:text-blue-500">Task-менеджер</a>
                </nav>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                    <button
                        className="relative text-gray-600 hover:text-blue-500 focus:outline-none"
                        onClick={handleBellClick}
                        aria-label="Уведомления"
                    >
                        <Bell className="w-5 h-5" />
                        {notifCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{notifCount}</span>
                        )}
                    </button>
                    <Link to="/profile" className="text-gray-600"><User className="w-5 h-5" /></Link>
                </div>
            </header>

            <main className="flex-1 bg-gray-50 py-6 sm:py-10 px-2 sm:px-6">
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-4 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center text-2xl sm:text-3xl">
                            {profileData.fullName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold mb-2">{profileData.fullName}</h1>
                            <div className="text-gray-600 text-base sm:text-lg">{profileData.email}</div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Роль:</h2>
                            <p className="text-gray-700">{ROLE_LABELS[profileData.role] || profileData.role}</p>
                        </div>

                        {isOwnProfile && (
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Обо мне:</h2>
                                {isEditing ? (
                                    <textarea
                                        value={profileData.about}
                                        onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                                        className="w-full p-2 border rounded h-32"
                                    />
                                ) : (
                                    <p className="text-gray-700">{profileData.about || "Нет информации"}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl font-semibold mb-3">Группы</h2>
                            <div className="space-y-2">
                                {profileData.groups?.map(group => (
                                    <div key={group.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="font-medium">{group.name}</div>
                                        <div className="text-sm text-gray-600">
                                            Роль: {ROLE_LABELS[group.role] || group.role}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isOwnProfile && (
                            <div className="flex space-x-4">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600"
                                        >
                                            Сохранить
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-colors border border-gray-300"
                                        >
                                            Отмена
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleEdit}
                                        className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600"
                                    >
                                        Редактировать
                                    </button>
                                )}
                            </div>
                        )}

                        {isOwnProfile && (
                            <button
                                onClick={handleLogout}
                                className="mt-8 bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600"
                            >
                                Выйти
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
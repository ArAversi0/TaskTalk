import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getNotifications } from '../services/api';
import { groupService } from '../services/groupService';
import { User, Bell } from "lucide-react";

export default function GroupStudentPage() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notifCount, setNotifCount] = useState(Number(localStorage.getItem('notifCount') || 0));
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    // Определяем роль пользователя в группе
    function getUserRoleInGroup(group) {
        if (group.adminId === user?.id) return 'admin';
        if (group.members && group.members.some(m => m.id === user?.id && m.role === 'teacher')) return 'teacher';
        if (group.members && group.members.some(m => m.id === user?.id && m.role === 'student')) return 'student';
        return null;
    }

    useEffect(() => {
        async function fetchGroups() {
            setLoading(true);
            try {
                const data = await groupService.getMyGroups();
                setGroups(data || []);
            } catch (e) {
                setError('Ошибка загрузки групп');
            } finally {
                setLoading(false);
            }
        }
        fetchGroups();
    }, []);

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

    const handleBellClick = () => {
        navigate('/notifications');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600">TaskTalk</Link>
                <nav className="space-x-6">
                    <Link to="/" className="text-gray-700 hover:text-blue-500">Главная</Link>
                    <Link to="/profile" className="text-gray-700 hover:text-blue-500">Профиль</Link>
                    <Link to="/groups" className="text-blue-600 font-semibold">Группы</Link>
                    <a href="#" className="text-gray-700 hover:text-blue-500">Task-менеджер</a>
                </nav>
                <div className="flex items-center space-x-4">
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
            <main className="flex-1 bg-blue-50 py-10 px-6">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Мои группы</h1>
                    {loading ? (
                        <div className="text-center">Загрузка...</div>
                    ) : error ? (
                        <div className="text-center text-red-500">{error}</div>
                    ) : groups.length === 0 ? (
                        <div className="text-center text-gray-500">У вас пока нет групп. Примите приглашение, чтобы присоединиться!</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groups.map(group => {
                                const role = getUserRoleInGroup(group);
                                return (
                                    <div
                                        key={group.id}
                                        className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:bg-blue-100 relative"
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                    >
                                        <div className="text-xl font-bold mb-1">{group.name}</div>
                                        <div className="text-gray-700 mb-2">{group.info}</div>
                                        <div className="text-gray-500 text-sm mb-2">Участников: {group.members_count || (group.members && group.members.length) || 0}</div>
                                        {role === 'student' && (
                                            <div className="text-xs text-gray-400">Ваша роль: <span className="text-gray-500">студент</span></div>
                                        )}
                                        {role === 'teacher' && (
                                            <div className="text-xs font-semibold text-blue-700 bg-blue-100 rounded px-2 py-1 inline-block mb-2">Ваша роль: Преподаватель</div>
                                        )}
                                        {role === 'admin' && (
                                            <div className="text-xs font-semibold text-yellow-700 bg-yellow-100 rounded px-2 py-1 inline-block mb-2">Ваша роль: Админ</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
} 
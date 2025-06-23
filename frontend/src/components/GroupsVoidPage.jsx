import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { getNotifications } from '../services/api';
import { useNavigate } from "react-router-dom";

export default function GroupsVoidPage() {
    const [notifCount, setNotifCount] = useState(Number(localStorage.getItem('notifCount') || 0));
    const navigate = useNavigate();
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
            {/* Header - такой же как в HomePage */}
            <header className="bg-white shadow-md px-2 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600 mb-2 sm:mb-0">TaskTalk</Link>
                <nav className="space-x-0 sm:space-x-6 flex flex-col sm:flex-row items-center">
                    <Link to="/" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Главная</Link>
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
                    <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600">Войти</Link>
                </div>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center bg-blue-50 py-6 sm:py-10 px-2 sm:px-6">
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-8 max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold mb-4">Для доступа к группам сначала зарегистрируйтесь или войдите в систему</h1>
                    <Link to="/" className="mt-6 inline-block bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600">Вернуться на главную</Link>
                </div>
            </main>
        </div>
    );
} 
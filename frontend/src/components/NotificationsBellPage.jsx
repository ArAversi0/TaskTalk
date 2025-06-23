import { useEffect, useState } from "react";
import { getNotifications, invitationAction } from "../services/api";
import { Link } from "react-router-dom";
import axios from "axios";
import { User } from "lucide-react";

export default function NotificationsBellPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null); // id уведомления, по которому идёт действие

    const user = JSON.parse(localStorage.getItem('user'));
    const isStudent = user?.role === 'student';

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const data = await getNotifications();
                setNotifications(data);
            } catch {
                setError("Ошибка загрузки уведомлений");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        async function markAsViewed() {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    await axios.post('http://localhost:8000/api/notifications/mark_viewed/', {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    localStorage.setItem('notifCount', '0');
                    window.dispatchEvent(new Event('notifCountUpdate'));
                } catch (error) {
                    console.error('Ошибка при отметке уведомлений как просмотренных:', error);
                }
            }
        }
        markAsViewed();
    }, []);

    const handleAction = async (notifId, action) => {
        setActionLoading(notifId + action);
        try {
            await invitationAction(notifId, action);
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, status: action === 'accept' ? 'accepted' : 'declined' } : n));
        } catch {
            setError("Ошибка обработки приглашения");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white shadow-md px-2 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600 mb-2 sm:mb-0">TaskTalk</Link>
                <nav className="space-x-0 sm:space-x-6 flex flex-col sm:flex-row items-center">
                    <Link to="/" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Главная</Link>
                    <Link to="/profile" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Профиль</Link>
                    <Link to="/groups" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Группы</Link>
                    <span className="text-blue-600 font-semibold">Уведомления</span>
                </nav>
            </header>
            <main className="flex-1 bg-blue-50 py-6 sm:py-10 px-2 sm:px-6">
                <div className="max-w-2xl mx-auto p-4 sm:p-8">
                    <h1 className="text-2xl font-bold mb-6">Уведомления</h1>
                    {loading ? (
                        <div className="text-center">Загрузка...</div>
                    ) : error ? (
                        <div className="text-center text-red-500">{error}</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center text-gray-500">Нет уведомлений</div>
                    ) : (
                        <ul className="space-y-4">
                            {notifications.filter(n => n.notif_type !== 'reminder').map(n => (
                                <li key={n.id} className={`bg-white rounded-xl shadow p-4 flex flex-col gap-2 border-l-4 ${n.notif_type === 'exclude' ? 'border-red-500' : 'border-blue-300'}`}>
                                    {n.notif_type === 'invite' && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">Приглашение в группу</span>
                                                <span className="ml-2 text-blue-600 font-semibold">{n.group_name}</span>
                                            </div>
                                            <div className="text-gray-700 text-sm">
                                                Пригласил: <b>{n.from_user_name || 'Админ'}</b>
                                            </div>
                                            <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</div>
                                            {n.status === 'pending' && (
                                                <div className="flex gap-4 mt-2">
                                                    <button
                                                        className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 disabled:opacity-50"
                                                        disabled={actionLoading === n.id + 'accept'}
                                                        onClick={() => handleAction(n.id, 'accept')}
                                                    >{actionLoading === n.id + 'accept' ? 'Принятие...' : 'Принять'}</button>
                                                    <button
                                                        className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 disabled:opacity-50"
                                                        disabled={actionLoading === n.id + 'decline'}
                                                        onClick={() => handleAction(n.id, 'decline')}
                                                    >{actionLoading === n.id + 'decline' ? 'Отклонение...' : 'Отклонить'}</button>
                                                </div>
                                            )}
                                            {n.status === 'accepted' && <div className="text-green-600 font-semibold mt-2">Вы приняли приглашение</div>}
                                            {n.status === 'declined' && <div className="text-red-500 font-semibold mt-2">Вы отклонили приглашение</div>}
                                        </>
                                    )}
                                    {n.notif_type === 'exclude' && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg text-red-600">Исключение из группы</span>
                                                <span className="ml-2 text-blue-600 font-semibold">{n.group_name}</span>
                                            </div>
                                            <div className="text-gray-700 text-sm">
                                                Вас исключил: <b>{n.from_user_name || 'Админ'}</b>
                                            </div>
                                            <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</div>
                                        </>
                                    )}
                                    {/* Здесь можно добавить другие типы уведомлений */}
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Секция напоминаний только для студентов */}
                    {isStudent && <>
                        <h2 className="text-2xl font-bold mt-12 mb-6">Напоминания</h2>
                        <ul className="space-y-4">
                            {notifications.filter(n => n.notif_type === 'reminder').length === 0 && (
                                <div className="text-center text-gray-500">Нет напоминаний</div>
                            )}
                            {notifications.filter(n => n.notif_type === 'reminder').map(n => {
                                const deadline = n.deadline_date;
                                const current = n.current_date;
                                const isOverdue = deadline && current && deadline < current;
                                return (
                                    <li key={n.id} className={`bg-white rounded-xl shadow p-4 flex flex-col gap-2 border-l-4 ${isOverdue ? 'border-red-500' : 'border-blue-500'}`}>
                                        <div className="font-bold text-lg">Напоминание о дедлайне</div>
                                        <div className="text-gray-700">Группа: <b>{n.group_name}</b></div>
                                        <div className="text-gray-700">Пост: <b>{n.post_title}</b></div>
                                        <div className="text-gray-700">Дата дедлайна: <b>{n.deadline_date}</b></div>
                                        <div className="text-gray-700">Текущая дата: <b>{n.current_date}</b></div>
                                        <button
                                            className="self-end mt-2 bg-gray-200 text-gray-700 px-4 py-1 rounded hover:bg-gray-300"
                                            onClick={async () => {
                                                try {
                                                    await axios.delete(`http://localhost:8000/api/notifications/${n.id}/delete/`, {
                                                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                                    });
                                                    setNotifications(prev => prev.filter(x => x.id !== n.id));
                                                } catch {
                                                    alert('Ошибка удаления напоминания');
                                                }
                                            }}
                                        >Убрать</button>
                                    </li>
                                );
                            })}
                        </ul>
                    </>}
                </div>
            </main>
        </div>
    );
} 
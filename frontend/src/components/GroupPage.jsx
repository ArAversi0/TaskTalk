import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { groupService } from '../services/groupService';
import postService from '../services/postService';
import { inviteToGroup, getNotifications } from '../services/api';
import { Bell, User } from 'lucide-react';

export default function GroupPage() {
    const { groupId } = useParams();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");
    const [postFiles, setPostFiles] = useState([]);
    const [error, setError] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));
    const currentUserId = user?.id;
    const navigate = useNavigate();
    const [postDeadline, setPostDeadline] = useState("");
    const [deadlineError, setDeadlineError] = useState("");
    const today = new Date().toISOString().split('T')[0];
    const [massDeleteMode, setMassDeleteMode] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState([]);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteError, setInviteError] = useState("");
    const [inviteSuccess, setInviteSuccess] = useState("");
    const [notifCount, setNotifCount] = useState(0);
    const [showExcludeModal, setShowExcludeModal] = useState(false);
    const [memberToExclude, setMemberToExclude] = useState(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    useEffect(() => {
        async function fetchGroup() {
            setLoading(true);
            try {
                const groups = await groupService.getMyGroups();
                const found = groups.find(g => String(g.id) === String(groupId));
                setGroup(found);
            } catch (e) {
                setError('Ошибка загрузки группы');
            } finally {
                setLoading(false);
            }
        }
        fetchGroup();
    }, [groupId]);

    useEffect(() => {
        async function fetchNotifCount() {
            try {
                const notifs = await getNotifications();
                const pending = notifs.filter(n => n.status === 'pending').length;
                setNotifCount(pending);
            } catch {
                setNotifCount(0);
            }
        }
        fetchNotifCount();
    }, []);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setDeadlineError("");
        if (postDeadline && postDeadline < today) {
            setDeadlineError("Дедлайн не может быть раньше сегодняшнего дня");
            return;
        }
        try {
            const newPost = await postService.createPost(group.id, {
                title: postTitle,
                content: postContent,
                deadline: postDeadline || null,
                files: postFiles
            });
            setGroup(prev => ({
                ...prev,
                posts: [newPost, ...(prev.posts || [])]
            }));
            setShowCreatePost(false);
            setPostTitle("");
            setPostContent("");
            setPostFiles([]);
            setPostDeadline("");
        } catch (e) {
            setError("Ошибка создания поста");
        }
    };

    // Функция для форматирования даты в ДД.ММ.ГГГГ
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = dateStr.slice(0, 10).split('-');
        if (d.length !== 3) return dateStr;
        return `${d[2]}.${d[1]}.${d[0]}`;
    }

    // Множественное удаление постов
    const handleSelectPost = (postId) => {
        setSelectedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
    };

    const handleDeleteSelected = async () => {
        setDeleting(true);
        try {
            for (const postId of selectedPosts) {
                await postService.deletePost(group.id, postId);
            }
            setGroup(prev => ({
                ...prev,
                posts: prev.posts.filter(p => !selectedPosts.includes(p.id))
            }));
            setSelectedPosts([]);
            setMassDeleteMode(false);
        } catch (e) {
            setError('Ошибка при удалении постов');
        } finally {
            setDeleting(false);
            setShowConfirmDelete(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteError("");
        setInviteSuccess("");
        if (!inviteEmail.match(/^\S+@\S+\.\S+$/)) {
            setInviteError("Введите корректный email");
            return;
        }
        try {
            await inviteToGroup(group.id, inviteEmail);
            setInviteSuccess(`Приглашение отправлено на ${inviteEmail}`);
            setTimeout(() => {
                setShowInviteModal(false);
                setInviteEmail("");
                setInviteSuccess("");
            }, 1500);
        } catch (e) {
            setInviteError(e?.response?.data?.error || "Ошибка отправки приглашения");
        }
    };

    const handleBellClick = () => {
        setNotifCount(0);
        navigate('/notifications');
    };

    // Функция обновления группы после исключения/выхода
    async function refreshGroup() {
        setLoading(true);
        try {
            const groups = await groupService.getMyGroups();
            const found = groups.find(g => String(g.id) === String(groupId));
            setGroup(found);
        } catch (e) {
            setError('Ошибка загрузки группы');
        } finally {
            setLoading(false);
        }
    }

    // Функция исключения участника
    const handleExclude = async () => {
        if (!memberToExclude) return;
        try {
            await groupService.excludeMember(group.id, memberToExclude.id);
            setShowExcludeModal(false);
            setMemberToExclude(null);
            await refreshGroup();
        } catch (e) {
            setError('Ошибка исключения участника');
        }
    };

    // Функция выхода преподавателя
    const handleLeave = async () => {
        try {
            await groupService.leaveGroup(group.id);
            setShowLeaveModal(false);
            navigate('/groups');
        } catch (e) {
            setError('Ошибка выхода из группы');
        }
    };

    if (loading) return <div className="p-8 text-center">Загрузка...</div>;
    if (!group) return <div className="p-8 text-center text-red-500">Группа не найдена</div>;

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white shadow-md px-2 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600 mb-2 sm:mb-0">TaskTalk</Link>
                <nav className="space-x-0 sm:space-x-6 flex flex-col sm:flex-row items-center">
                    <Link to="/" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Главная</Link>
                    <Link to="/profile" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Профиль</Link>
                    <Link to="/groups" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Группы</Link>
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
            <main className="flex-1 bg-blue-50 py-6 sm:py-10 px-2 sm:px-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8">
                    {/* Sidebar */}
                    <aside className="w-full md:w-80 bg-blue-50 rounded-xl p-4 shadow-md mb-6 md:mb-0">
                        <h3 className="font-bold mb-2">Участники</h3>
                        <ul className="space-y-2">
                            {group.members && group.members.map((m) => (
                                <li key={m.id} className="flex items-center justify-between gap-2 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Link to={`/users/${m.id}`} className="hover:underline text-gray-700 truncate max-w-[110px]">{m.name}</Link>
                                        {m.role === "admin" && (
                                            <span className="text-xs bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded">Админ</span>
                                        )}
                                        {m.role === "teacher" && (
                                            <span className="text-xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded">Преподаватель</span>
                                        )}
                                    </div>
                                    {/* Кнопка "Исключить" для админа (кроме себя и админа) */}
                                    {group.adminId === currentUserId && m.id !== currentUserId && m.role !== 'admin' && (
                                        <button
                                            className="text-xs text-red-600 hover:underline whitespace-nowrap ml-2"
                                            onClick={() => { setMemberToExclude(m); setShowExcludeModal(true); }}
                                        >Исключить</button>
                                    )}
                                    {/* Кнопка "Выйти" для преподавателя-участника (не админа) */}
                                    {m.id === currentUserId && m.role === 'teacher' && group.adminId !== currentUserId && (
                                        <button
                                            className="text-xs text-gray-600 hover:underline whitespace-nowrap ml-2"
                                            onClick={() => setShowLeaveModal(true)}
                                        >Выйти</button>
                                    )}
                                    {/* Кнопка "Выйти" для студента */}
                                    {m.id === currentUserId && m.role === 'student' && (
                                        <button
                                            className="text-xs text-gray-600 hover:underline whitespace-nowrap ml-2"
                                            onClick={() => setShowLeaveModal(true)}
                                        >Выйти</button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {/* Кнопка "Пригласить" всегда для админа, под списком участников */}
                        {group.adminId === currentUserId && (
                            <button
                                className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600"
                                onClick={() => setShowInviteModal(true)}
                            >Пригласить</button>
                        )}
                    </aside>
                    {/* Основная часть */}
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row justify-end items-center mb-2 gap-2 sm:gap-4">
                            <button className="bg-red-500 text-white px-4 sm:px-6 py-2 rounded-xl hover:bg-red-600 transition-colors w-full sm:w-auto mb-2 sm:mb-0" onClick={() => navigate('/groups')}>Вернуться</button>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{group.name}</h1>
                        <div className="mb-4 p-2 sm:p-4 bg-yellow-100 rounded">{group.info}</div>
                        {/* Кнопки для админа */}
                        {group.adminId === currentUserId && (
                            <div className="flex gap-4 mb-4">
                                <button
                                    className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600"
                                    onClick={() => setShowCreatePost(true)}
                                >Создать пост</button>
                                <button
                                    className={`bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 ${massDeleteMode ? 'opacity-70' : ''}`}
                                    onClick={() => setMassDeleteMode(v => !v)}
                                    disabled={massDeleteMode || !group.posts || group.posts.length === 0}
                                >Удалить посты</button>
                            </div>
                        )}
                        {/* Модальное окно создания поста */}
                        {showCreatePost && (
                            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl shadow-md p-8 max-w-lg w-full">
                                    <h2 className="text-lg font-bold mb-4">Создать пост</h2>
                                    <form onSubmit={handleCreatePost}>
                                        <input
                                            className="w-full p-2 border rounded mb-4"
                                            placeholder="Тема поста"
                                            value={postTitle}
                                            onChange={e => setPostTitle(e.target.value)}
                                            required
                                        />
                                        <textarea
                                            className="w-full p-2 border rounded mb-4"
                                            placeholder="Содержание поста"
                                            value={postContent}
                                            onChange={e => setPostContent(e.target.value)}
                                            required
                                        />
                                        <label className="block mb-2 font-semibold">Дедлайн (необязательно):</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border rounded mb-2"
                                            value={postDeadline}
                                            min={today}
                                            onChange={e => {
                                                // Сохраняем только YYYY-MM-DD
                                                const val = e.target.value.slice(0, 10);
                                                setPostDeadline(val);
                                            }}
                                            style={{ userSelect: 'none' }}
                                        />
                                        {deadlineError && <div className="text-red-500 mb-2">{deadlineError}</div>}
                                        <input
                                            type="file"
                                            multiple
                                            className="mb-4"
                                            onChange={e => {
                                                const files = Array.from(e.target.files);
                                                setPostFiles(prev => [...prev, ...files.filter(f => !prev.some(pf => pf.name === f.name && pf.size === f.size))]);
                                                e.target.value = '';
                                            }}
                                        />
                                        {postFiles.length > 0 && (
                                            <ul className="mb-4">
                                                {postFiles.map((file, idx) => (
                                                    <li key={file.name + file.size} className="flex items-center gap-2 text-sm">
                                                        <span>{file.name}</span>
                                                        <button type="button" className="text-red-500 hover:underline" onClick={() => setPostFiles(prev => prev.filter((_, i) => i !== idx))}>Удалить</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div className="flex gap-4">
                                            <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600">Опубликовать</button>
                                            <button type="button" className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-colors border border-gray-300" onClick={() => setShowCreatePost(false)}>Отмена</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        {/* Ссылки на посты с чекбоксами для массового удаления */}
                        {group.posts && group.posts.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold mb-2">Посты группы:</h4>
                                {massDeleteMode && (
                                    <div className="flex gap-4 mb-2">
                                        <button
                                            className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 disabled:opacity-50"
                                            disabled={selectedPosts.length === 0 || deleting}
                                            onClick={() => setShowConfirmDelete(true)}
                                        >Удалить выбранные</button>
                                        <button
                                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 border border-gray-300"
                                            onClick={() => { setMassDeleteMode(false); setSelectedPosts([]); }}
                                            disabled={deleting}
                                        >Отмена</button>
                                    </div>
                                )}
                                <ul className="space-y-1">
                                    {[...group.posts]
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .map(post => (
                                            <li key={post.id} className="flex items-center gap-2">
                                                {massDeleteMode && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPosts.includes(post.id)}
                                                        onChange={() => handleSelectPost(post.id)}
                                                        disabled={deleting}
                                                    />
                                                )}
                                                <Link
                                                    to={`/groups/${group.id}/post/${post.id}`}
                                                    className="text-blue-600 underline"
                                                >
                                                    {post.title}
                                                </Link>
                                                {post.deadline && (
                                                    <span className="ml-2 text-xs text-gray-500">Дедлайн: {formatDate(post.deadline)}</span>
                                                )}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        )}
                        {group.posts && group.posts.length === 0 && (
                            <div className="text-gray-500">Нет созданных постов</div>
                        )}
                        {/* Модальное окно подтверждения удаления */}
                        {showConfirmDelete && (
                            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl shadow-md p-8 max-w-lg w-full">
                                    <h2 className="text-lg font-bold mb-4">Подтвердите удаление</h2>
                                    <p className="mb-4">Вы уверены, что хотите удалить выбранные посты? Это действие необратимо.</p>
                                    <div className="flex gap-4">
                                        <button
                                            className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 disabled:opacity-50"
                                            onClick={handleDeleteSelected}
                                            disabled={deleting}
                                        >{deleting ? 'Удаление...' : 'Удалить'}</button>
                                        <button
                                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 border border-gray-300"
                                            onClick={() => setShowConfirmDelete(false)}
                                            disabled={deleting}
                                        >Отмена</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Модальное окно приглашения */}
                        {showInviteModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
                                    <h2 className="text-lg font-bold mb-4">Пригласить в группу</h2>
                                    <form onSubmit={handleInvite}>
                                        <input
                                            className="w-full p-2 border rounded mb-2"
                                            placeholder="Email пользователя"
                                            value={inviteEmail}
                                            onChange={e => setInviteEmail(e.target.value)}
                                            required
                                            type="email"
                                        />
                                        {inviteError && <div className="text-red-500 mb-2">{inviteError}</div>}
                                        {inviteSuccess && <div className="text-green-600 mb-2">{inviteSuccess}</div>}
                                        <div className="flex gap-4 mt-2">
                                            <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600">Отправить приглашение</button>
                                            <button type="button" className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 border border-gray-300" onClick={() => setShowInviteModal(false)}>Отмена</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        {/* Модальное окно подтверждения исключения */}
                        {showExcludeModal && memberToExclude && (
                            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
                                    <h2 className="text-xl font-bold mb-6 text-center text-red-700">Исключить участника?</h2>
                                    <div className="mb-4 text-center">Вы уверены, что хотите исключить <b>{memberToExclude.name}</b> из группы?</div>
                                    <div className="flex gap-6 justify-end mt-8">
                                        <button
                                            className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600"
                                            onClick={handleExclude}
                                        >Исключить</button>
                                        <button
                                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 border border-gray-300"
                                            onClick={() => { setShowExcludeModal(false); setMemberToExclude(null); }}
                                        >Отмена</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Модальное окно подтверждения выхода */}
                        {showLeaveModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
                                    <h2 className="text-xl font-bold mb-6 text-center text-gray-700">Покинуть группу?</h2>
                                    <div className="mb-4 text-center">Вы уверены, что хотите выйти из группы <b>{group.name}</b>?</div>
                                    <div className="flex gap-6 justify-end mt-8">
                                        <button
                                            className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600"
                                            onClick={handleLeave}
                                        >Выйти</button>
                                        <button
                                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 border border-gray-300"
                                            onClick={() => setShowLeaveModal(false)}
                                        >Отмена</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
} 
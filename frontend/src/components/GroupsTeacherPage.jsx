import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { groupService } from '../services/groupService';
import postService from '../services/postService';
import { getNotifications } from '../services/api';

const currentUserId = 1; // TODO: получать из user

export default function GroupsTeacherPage() {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [groupName, setGroupName] = useState("");
    const [groupInfo, setGroupInfo] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [notifCount, setNotifCount] = useState(Number(localStorage.getItem('notifCount') || 0));
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        async function fetchGroups() {
            setLoading(true);
            try {
                const data = await groupService.getMyGroups();
                setGroups(data);
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

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const newGroup = await groupService.createGroup({ name: groupName, info: groupInfo });
            setGroups(prev => Array.isArray(prev) ? [...prev, newGroup] : [newGroup]);
            setShowCreateGroup(false);
            setGroupName("");
            setGroupInfo("");
        } catch (e) {
            setCreateError("Ошибка создания группы");
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            const newPost = await postService.createPost(selectedGroup.id, {
                title: postTitle,
                content: postContent
            });
            setSelectedGroup(prev => ({
                ...prev,
                posts: [newPost, ...(prev.posts || [])]
            }));
            setShowCreatePost(false);
            setPostTitle("");
            setPostContent("");
        } catch (e) {
            console.error('Error creating post:', e);
        }
    };

    // Функция удаления группы
    const handleDeleteGroup = async () => {
        if (!groupToDelete) return;
        try {
            await groupService.deleteGroup(groupToDelete.id);
            setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
            setShowDeleteModal(false);
            setGroupToDelete(null);
        } catch (e) {
            alert('Ошибка удаления группы');
        }
    };

    const handleBellClick = () => {
        setNotifCount(0);
        navigate('/notifications');
    };

    // Определяем роль пользователя в группе
    function getUserRoleInGroup(group) {
        if (group.adminId === user?.id) return 'admin';
        if (group.members && group.members.some(m => m.id === user?.id && m.role === 'teacher')) return 'teacher';
        return 'student';
    }

    // Сортируем группы: сначала админ, потом преподаватель, потом остальные
    const sortedGroups = Array.isArray(groups) ? [...groups].sort((a, b) => {
        const roleA = getUserRoleInGroup(a);
        const roleB = getUserRoleInGroup(b);
        if (roleA === roleB) return 0;
        if (roleA === 'admin') return -1;
        if (roleB === 'admin') return 1;
        if (roleA === 'teacher') return -1;
        if (roleB === 'teacher') return 1;
        return 0;
    }) : [];

    // UI для сайдбара участников
    const renderSidebar = (group) => (
        <aside className="w-64 bg-blue-50 rounded-xl p-4 shadow-md">
            <h3 className="font-bold mb-2">Участники</h3>
            <ul className="space-y-2">
                {group.members.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                        <Link
                            to={`/users/${m.id}`}
                            className="hover:underline text-gray-700"
                        >
                            {m.name}
                        </Link>
                        {m.role === "admin" && (
                            <span className="text-xs bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded">Админ</span>
                        )}
                        {m.role === "teacher" && (
                            <span className="text-xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded">Преподаватель</span>
                        )}
                    </li>
                ))}
            </ul>
            <button
                className="mt-4 w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600"
                onClick={() => setShowInvite(true)}
            >
                Пригласить участника
            </button>
        </aside>
    );

    // UI для создания группы
    const renderCreateGroup = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4">Создать новую группу</h2>
                <form onSubmit={handleCreateGroup}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Название группы</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Описание</label>
                        <textarea
                            value={groupInfo}
                            onChange={(e) => setGroupInfo(e.target.value)}
                            className="w-full p-2 border rounded"
                            rows="3"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={() => setShowCreateGroup(false)}
                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-colors border border-gray-300"
                        >Отмена</button>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600"
                        >Создать</button>
                    </div>
                </form>
            </div>
        </div>
    );

    // UI для приглашения участника
    const renderInvite = () => (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-md p-8 max-w-sm w-full">
                <h2 className="text-lg font-bold mb-4">Укажите почту участника</h2>
                <input
                    className="w-full p-2 border rounded mb-4"
                    placeholder="Почта участника"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                />
                <div className="flex gap-4">
                    <button className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600">Пригласить</button>
                    <button className="text-gray-500 underline" onClick={() => setShowInvite(false)}>Отмена</button>
                </div>
            </div>
        </div>
    );

    // Форма создания поста (только для админа)
    const renderCreatePost = (group) => (
        <div className="mb-6 p-4 border rounded">
            <h3 className="text-lg font-bold mb-4">Новый пост</h3>
            <form onSubmit={handleCreatePost}>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Заголовок</label>
                    <input
                        type="text"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Содержание</label>
                    <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows="4"
                        required
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setShowCreatePost(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Опубликовать
                    </button>
                </div>
            </form>
        </div>
    );

    // UI для поста внутри группы
    const renderPost = (post, group) => (
        <div key={post.id} className="bg-blue-50 rounded-xl p-4 mb-4 shadow">
            <h4 className="font-semibold mb-2">{post.title}</h4>
            <div className="mb-2">{post.content}</div>
            {/* Файлы */}
            {post.files && post.files.length > 0 && (
                <div className="mb-2">
                    <b>Файлы:</b>
                    <ul className="list-disc ml-6">
                        {post.files.map(f => (
                            <li key={f.id}>
                                <a href={f.url} download className="text-blue-600 underline">{f.name}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {/* Чат с преподавателем — только если автор поста не текущий преподаватель */}
            {post.authorId !== currentUserId && (
                <button className="text-blue-600 underline mb-2">Чат с преподавателем</button>
            )}
            <div className="mt-2">
                <h5 className="font-semibold">Комментарии:</h5>
                {post.comments && post.comments.map(comment => (
                    <div key={comment.id} className="text-sm bg-white rounded p-2 my-1 border">
                        <b>{comment.author}:</b> {comment.text}
                    </div>
                ))}
                <input className="w-full p-2 border rounded mt-2" placeholder="Добавить комментарий..." />
            </div>
        </div>
    );

    // UI для выбранной группы
    const renderGroup = (group) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-3/4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{group.name}</h2>
                    <button
                        onClick={() => setSelectedGroup(null)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2">
                        {group.adminId === currentUserId && (
                            <button
                                onClick={() => setShowCreatePost(true)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
                            >
                                Создать пост
                            </button>
                        )}

                        {showCreatePost && renderCreatePost(group)}

                        <div className="space-y-4">
                            {group.posts && group.posts.map(post => (
                                <div key={post.id} className="border rounded p-4">
                                    <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                                    <p className="text-gray-600 mb-2">{post.content}</p>
                                    <div className="text-sm text-gray-500">
                                        Автор: {post.author_name} • {new Date(post.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-span-1">
                        <h3 className="text-lg font-bold mb-4">Участники</h3>
                        <div className="space-y-2">
                            {group.members && group.members.map(member => (
                                <div key={member.id} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span>{member.name}</span>
                                    <span className="text-sm text-gray-500">({member.role})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-blue-50">
            <header className="bg-white shadow-md px-2 sm:px-6 py-4 flex flex-col sm:flex-row sm:justify-between items-center">
                <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto">
                    <Link to="/" className="text-2xl font-bold text-blue-600 mb-2 sm:mb-0 sm:mr-6">TaskTalk</Link>
                    <nav className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 w-full sm:w-auto justify-center">
                        <Link to="/" className="text-gray-700 hover:text-blue-500">Главная</Link>
                        <Link to="/profile" className="text-gray-700 hover:text-blue-500">Профиль</Link>
                        <Link to="/groups" className="text-gray-700 hover:text-blue-500">Группы</Link>
                        <a href="#" className="text-gray-700 hover:text-blue-500">Task-менеджер</a>
                    </nav>
                </div>
                <div className="flex items-center gap-4 mt-2 sm:mt-0">
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
            <main className="flex-1 py-6 sm:py-10 px-2 sm:px-6">
                <div className="w-full max-w-6xl mx-auto px-2 sm:px-0 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex-shrink-0">Мои группы</h1>
                    <button
                        className="bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-xl hover:bg-blue-600 w-full sm:w-auto"
                        onClick={() => setShowCreateGroup(true)}
                    >
                        Создать группу
                    </button>
                </div>
                <div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0">
                    {sortedGroups.map(g => (
                        <div
                            key={g.id}
                            className="bg-white rounded-xl shadow-md p-4 sm:p-6 cursor-pointer hover:bg-blue-100 relative w-full"
                            onClick={() => navigate(`/groups/${g.id}`)}
                        >
                            <h3 className="text-lg sm:text-xl font-bold mb-2">{g.name}</h3>
                            <div className="text-gray-600 mb-2">{g.info}</div>
                            <div className="text-sm text-gray-500 mb-2">Участников: {(g.members && g.members.length) || 0}</div>
                            {/* Надпись о роли пользователя */}
                            {getUserRoleInGroup(g) === 'admin' && (
                                <div className="text-xs font-semibold text-yellow-700 bg-yellow-100 rounded px-2 py-1 inline-block mb-2">Ваша роль: Админ</div>
                            )}
                            {getUserRoleInGroup(g) === 'teacher' && (
                                <div className="text-xs font-semibold text-blue-700 bg-blue-100 rounded px-2 py-1 inline-block mb-2">Ваша роль: Преподаватель</div>
                            )}
                            {getUserRoleInGroup(g) === 'admin' && (
                                <button
                                    className="absolute bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 z-10"
                                    onClick={e => { e.stopPropagation(); setGroupToDelete(g); setShowDeleteModal(true); }}
                                >Удалить</button>
                            )}
                        </div>
                    ))}
                </div>
                {showCreateGroup && renderCreateGroup()}
                {showInvite && renderInvite()}
                {showDeleteModal && groupToDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-md p-10 max-w-lg w-full">
                            <h2 className="text-2xl font-bold mb-8 text-center text-red-700">Вы точно желаете удалить группу?</h2>
                            <div className="flex gap-8 justify-end mt-8">
                                <button
                                    className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 transition-colors"
                                    onClick={handleDeleteGroup}
                                >Удалить</button>
                                <button
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-colors border border-gray-300"
                                    onClick={() => { setShowDeleteModal(false); setGroupToDelete(null); }}
                                >Отмена</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
} 
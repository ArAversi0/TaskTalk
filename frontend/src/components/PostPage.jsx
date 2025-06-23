import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import postService from '../services/postService';
import { getNotifications } from '../services/api';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = dateStr.slice(0, 10).split('-');
    if (d.length !== 3) return dateStr;
    return `${d[2]}.${d[1]}.${d[0]}`;
}

export default function PostPage() {
    const { postId, groupId } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [error, setError] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editDeadline, setEditDeadline] = useState("");
    const [editFiles, setEditFiles] = useState([]);
    const [filesToDelete, setFilesToDelete] = useState([]);
    const today = new Date().toISOString().split('T')[0];
    const [notifCount, setNotifCount] = useState(0);

    useEffect(() => {
        async function fetchPost() {
            setLoading(true);
            try {
                const data = await postService.getPost(groupId, postId);
                setPost(data);
                if (!editMode) {
                    setEditTitle(data.title);
                    setEditContent(data.content);
                    setEditDeadline(data.deadline ? data.deadline.slice(0, 10) : "");
                    setEditFiles([]);
                    setFilesToDelete([]);
                }
            } catch (e) {
                setError('Ошибка загрузки поста');
            } finally {
                setLoading(false);
            }
        }
        fetchPost();
    }, [groupId, postId, editMode]);

    useEffect(() => {
        async function fetchNotifCount() {
            try {
                const notifs = await getNotifications();
                const pending = notifs.filter(n => n.status === 'pending' || n.notif_type === 'exclude').length;
                setNotifCount(pending);
            } catch {
                setNotifCount(0);
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

    const handleAddComment = async (e) => {
        e.preventDefault();
        try {
            const payload = { text: comment };
            if (replyTo) payload.parent = replyTo;
            await postService.addComment(groupId, postId, payload);
            setComment("");
            setReplyTo(null);
            const data = await postService.getPost(groupId, postId);
            setPost(data);
        } catch {
            setError('Ошибка добавления комментария');
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await postService.deleteComment(groupId, postId, commentId);
            const data = await postService.getPost(groupId, postId);
            setPost(data);
        } catch {
            setError('Ошибка удаления комментария');
        }
    };

    const renderAuthor = (c) => (
        <>
            <b>{c.author_name}</b>
            {c.author_role && (
                <span className={
                    c.author_role === 'Преподаватель' || c.author_role === 'teacher'
                        ? 'ml-1 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded'
                        : 'ml-1 text-xs text-gray-500'
                }>
                    ({c.author_role === 'teacher' ? 'Преподаватель' : c.author_role})
                </span>
            )}
        </>
    );

    const handleReply = (comment) => {
        setReplyTo(comment.id);
        setComment(`@${comment.author_name}, `);
    };

    const handleEdit = () => {
        setEditMode(true);
        setEditTitle(post.title);
        setEditContent(post.content);
        setEditDeadline(post.deadline ? post.deadline.slice(0, 10) : "");
        setEditFiles([]);
        setFilesToDelete([]);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
    };

    const handleFileDelete = (fileId) => {
        setFilesToDelete(prev => [...prev, fileId]);
    };

    const handleUndoFileDelete = (fileId) => {
        setFilesToDelete(prev => prev.filter(id => id !== fileId));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await postService.updatePost(groupId, postId, {
                title: editTitle,
                content: editContent,
                deadline: editDeadline,
                file_ids_to_delete: filesToDelete,
                files: editFiles
            });
            setEditMode(false);
        } catch {
            setError('Ошибка сохранения изменений');
        }
    };

    const handleBellClick = () => {
        setNotifCount(0);
        localStorage.setItem('notifCount', '0');
        window.dispatchEvent(new Event('notifCountUpdate'));
        navigate('/notifications');
    };

    if (loading) return <div className="p-8 text-center">Загрузка...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!post) return <div className="p-8 text-center text-gray-500">Пост не найден</div>;

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
            <main className="flex-1 bg-blue-50 py-6 sm:py-10 px-2 sm:px-6">
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-4 sm:p-8">
                    <div className="flex justify-end mb-2">
                        <button className="bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600" onClick={() => navigate(-1)}>Вернуться</button>
                    </div>
                    {editMode ? (
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <input
                                className="w-full p-2 border rounded"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                required
                                placeholder="Название поста"
                            />
                            <textarea
                                className="w-full p-2 border rounded"
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                                required
                                placeholder="Содержание поста"
                            />
                            <label className="block font-semibold">Дедлайн (необязательно):</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded"
                                value={editDeadline}
                                min={today}
                                onChange={e => setEditDeadline(e.target.value)}
                            />
                            <div>
                                <b>Файлы:</b>
                                {post.files && post.files.length > 0 ? (
                                    <ul className="list-disc ml-6">
                                        {post.files.map(f => (
                                            <li key={f.id} className="flex items-center gap-2">
                                                <a
                                                    href={f.file && f.file.startsWith('http') ? f.file : `http://localhost:8000${f.file}`}
                                                    download
                                                    className="text-blue-600 underline"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {f.file ? decodeURIComponent(f.file.split('/').pop()) : 'Файл'}
                                                </a>
                                                {filesToDelete.includes(f.id) ? (
                                                    <button type="button" className="text-green-500 text-xs" onClick={() => handleUndoFileDelete(f.id)}>Восстановить</button>
                                                ) : (
                                                    <button type="button" className="text-red-500 text-xs" onClick={() => handleFileDelete(f.id)}>Удалить</button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-gray-400 ml-2">Нет файлов</span>
                                )}
                                <div className="mt-2">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={e => setEditFiles(Array.from(e.target.files))}
                                    />
                                    {editFiles.length > 0 && (
                                        <ul className="mt-2">
                                            {editFiles.map((file, idx) => (
                                                <li key={file.name + file.size} className="flex items-center gap-2 text-sm">
                                                    <span>{file.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600">Сохранить</button>
                                <button type="button" className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 border border-gray-300" onClick={handleCancelEdit}>Отмена</button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
                            <div className="mb-2 text-gray-700">{post.content}</div>
                            {post.deadline && (
                                <div className="mb-2 text-sm text-gray-500">Дедлайн: {formatDate(post.deadline)}</div>
                            )}
                            <div className="mb-4">
                                <b>Файлы:</b>
                                {post.files && post.files.length > 0 ? (
                                    <ul className="list-disc ml-6">
                                        {post.files.map(f => (
                                            <li key={f.id}>
                                                <a
                                                    href={f.file && f.file.startsWith('http') ? f.file : `http://localhost:8000${f.file}`}
                                                    download
                                                    className="text-blue-600 underline"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {f.file ? decodeURIComponent(f.file.split('/').pop()) : 'Файл'}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-gray-400 ml-2">Нет файлов</span>
                                )}
                            </div>
                            {post.author === user?.id && (
                                <button className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 mb-4" onClick={handleEdit}>Редактировать</button>
                            )}
                        </>
                    )}
                    <div className="mb-4">
                        <b>Комментарии:</b>
                        {post.comments && post.comments.length > 0 ? (
                            <ul className="mt-2 space-y-2">
                                {post.comments.map(c => (
                                    <li key={c.id} className={`bg-gray-100 rounded p-2 flex flex-col gap-1${c.parent ? ' ml-6 border-l-4 border-blue-200 bg-blue-50' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            {renderAuthor(c)}
                                            <span className="text-gray-700 break-words" style={{ wordBreak: 'break-word' }}>{c.text}</span>
                                            <span className="text-xs text-gray-400 ml-2">{formatDate(c.created_at)}</span>
                                            {(isAdmin || user?.id === c.author) && (
                                                <button className="text-red-500 ml-2 text-xs" onClick={() => handleDeleteComment(c.id)}>Удалить</button>
                                            )}
                                            <button className="text-blue-500 ml-2 text-xs" onClick={() => handleReply(c)}>Ответить</button>
                                        </div>
                                        {c.parent && (() => {
                                            const parent = post.comments.find(pc => pc.id === c.parent);
                                            return parent ? (
                                                <div className="text-xs text-gray-500 bg-gray-50 p-1 rounded">
                                                    ↳ Ответ на: <b>{parent.author_name}</b> {parent.author_role && `(${parent.author_role})`} — <span className="italic">{parent.text.slice(0, 40)}{parent.text.length > 40 ? '…' : ''}</span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-400">↳ Ответ на удалённый комментарий</div>
                                            );
                                        })()}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-gray-400 mt-2">Комментариев нет</div>
                        )}
                        <form className="mt-4 flex gap-2" onSubmit={handleAddComment}>
                            {replyTo && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Ответ на комментарий #{replyTo} <button type="button" className="ml-1 text-red-400" onClick={() => setReplyTo(null)}>×</button></span>
                            )}
                            <input
                                className="flex-1 p-2 border rounded"
                                placeholder="Добавить комментарий..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                required
                            />
                            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600">Отправить</button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
} 
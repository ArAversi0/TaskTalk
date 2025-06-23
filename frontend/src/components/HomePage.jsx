import { Bell, Facebook, Twitter, Linkedin, Plus, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getNotifications } from '../services/api';
import { useState, useEffect } from "react";

const MOTIVATION_PHRASES = [
  "Учись не для школы, а для жизни!",
  "Лучший способ что-то выучить — объяснить это другому.",
  "Делай маленькие шаги каждый день — и результат не заставит себя ждать.",
  "Не бойся ошибаться — бойся не пробовать!",
  "Планируй свой день — и времени хватит на всё.",
  "Ставь цели и отмечай прогресс — это мотивирует!",
  "Отдыхай с умом: мозгу тоже нужен перерыв.",
  "Задавай вопросы — так ты учишься быстрее.",
  "Не сравнивай себя с другими, сравнивай себя с собой вчерашним.",
  "Учёба — это инвестиция в себя.",
  "Сложное становится простым, если не сдаваться.",
  "Делай конспекты — это помогает запоминать.",
  "Не бойся просить помощи — вместе легче!",
  "Главное — начать, а дальше будет легче.",
  "Учись с интересом, а не из-под палки!"
];

function getRandomIndexes(count, exclude = []) {
  const available = MOTIVATION_PHRASES.map((_, i) => i).filter(i => !exclude.includes(i));
  const result = [];
  while (result.length < count && available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    result.push(available[idx]);
    available.splice(idx, 1);
  }
  return result;
}

const HomePage = ({ user }) => {
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(Number(localStorage.getItem('notifCount') || 0));
  const [phraseIndexes, setPhraseIndexes] = useState(() => getRandomIndexes(4));
  const [fadeStates, setFadeStates] = useState([false, false, false, false]);
  const [activeTile, setActiveTile] = useState(null);

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
    setNotifCount(0); // сбрасываем после просмотра
    navigate('/notifications');
  };

  const handleTileClick = (tileIdx) => {
    // Получаем индексы фраз, которые уже на других тайлах
    const used = phraseIndexes.filter((_, i) => i !== tileIdx);
    const available = MOTIVATION_PHRASES.map((_, i) => i).filter(i => !used.includes(i) && i !== phraseIndexes[tileIdx]);
    if (available.length === 0) return; // все варианты уже на экране
    const newIdx = available[Math.floor(Math.random() * available.length)];
    setActiveTile(tileIdx);
    // Анимация: сначала плавно скрываем
    setFadeStates(prev => prev.map((f, i) => i === tileIdx ? true : f));
    setTimeout(() => {
      setPhraseIndexes(prev => prev.map((idx, i) => i === tileIdx ? newIdx : idx));
      setFadeStates(prev => prev.map((f, i) => i === tileIdx ? false : f));
    }, 250); // длительность анимации скрытия
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md px-2 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 mb-2 sm:mb-0">TaskTalk</Link>
        <nav className="space-x-0 sm:space-x-6 flex flex-col sm:flex-row items-center">
          <Link to="/" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Главная</Link>
          {user && (
            <Link to="/profile" className="text-gray-700 hover:text-blue-500 mb-1 sm:mb-0">Профиль</Link>
          )}
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
          {user ? (
            <Link to="/profile" className="text-gray-600"><User className="w-5 h-5" /></Link>
          ) : (
            <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600">Войти</Link>
          )}
        </div>
      </header>

      {/* Banner */}
      <section className="bg-blue-50 text-center py-20 sm:py-40 px-2 sm:px-6">
        <h1 className="text-3xl sm:text-5xl font-extrabold mb-6 text-gray-800">
          Добро пожаловать в <span className="text-blue-600">TaskTalk</span>
        </h1>
        <p className="text-base sm:text-xl text-gray-700 mb-10">
          Удобная платформа для взаимодействия между студентами и преподавателями.
        </p>
        <ul className="max-w-2xl mx-auto text-left text-gray-700 space-y-4 text-base sm:text-lg">
          <li className="flex items-center">
            <Plus className="w-6 h-6 mr-2 text-green-500" />
            <span>Отправка домашних заданий преподавателями</span>
          </li>
          <li className="flex items-center">
            <Plus className="w-6 h-6 mr-2 text-green-500" />
            <span>Организация групп по предметам</span>
          </li>
          <li className="flex items-center">
            <Plus className="w-6 h-6 mr-2 text-green-500" />
            <span>Уведомления о дедлайнах заданий в реальном времени</span>
          </li>
          <li className="flex items-center">
            <Plus className="w-6 h-6 mr-2 text-green-500" />
            <span>Task-менеджер для отслеживания прогресса</span>
          </li>
        </ul>
      </section>

      {/* Tiles */}
      <main className="flex-1 bg-white py-10 px-6">
        <div className="flex flex-col items-center w-full">
          <div className="flex flex-col sm:flex-row mb-4 sm:mb-6 w-full sm:justify-center">
            {[0, 1].map((i) => {
              const isActive = activeTile === i;
              return (
                <div
                  key={i}
                  className={`relative bg-white rounded-lg shadow p-4 sm:p-6 cursor-pointer transition flex items-center min-h-[100px] sm:min-h-[120px] w-full sm:w-[420px]${i === 0 ? ' sm:mr-6' : ''} mb-2 sm:mb-0`}
                  style={{
                    boxShadow: isActive
                      ? '0 -4px 16px 0 #2563eb66'
                      : '0 -2px 8px 0 #2563eb33',
                    borderTop: '6px solid #2563eb',
                    transition: 'box-shadow 0.4s, border-top-color 0.4s, opacity 0.25s',
                    overflow: 'hidden',
                    minHeight: 120
                  }}
                  onClick={() => handleTileClick(i)}
                >
                  <span
                    className={`block text-blue-900 text-lg font-medium transition-opacity duration-250 ${fadeStates[i] ? 'opacity-0' : 'opacity-100'}`}
                    style={{ transition: 'opacity 0.25s' }}
                  >
                    {MOTIVATION_PHRASES[phraseIndexes[i]]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:justify-center">
            {[2, 3].map((i) => {
              const isActive = activeTile === i;
              return (
                <div
                  key={i}
                  className={`relative bg-white rounded-lg shadow p-4 sm:p-6 cursor-pointer transition flex items-center min-h-[100px] sm:min-h-[120px] w-full sm:w-[420px]${i === 2 ? ' sm:mr-6' : ''}`}
                  style={{
                    boxShadow: isActive
                      ? '0 -4px 16px 0 #2563eb66'
                      : '0 -2px 8px 0 #2563eb33',
                    borderTop: '6px solid #2563eb',
                    transition: 'box-shadow 0.4s, border-top-color 0.4s, opacity 0.25s',
                    overflow: 'hidden',
                    minHeight: 120
                  }}
                  onClick={() => handleTileClick(i)}
                >
                  <span
                    className={`block text-blue-900 text-lg font-medium transition-opacity duration-250 ${fadeStates[i] ? 'opacity-0' : 'opacity-100'}`}
                    style={{ transition: 'opacity 0.25s' }}
                  >
                    {MOTIVATION_PHRASES[phraseIndexes[i]]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 px-2 sm:px-6 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="space-x-4 text-sm text-gray-600">
            <Link to="/" className="hover:underline">Главная</Link>
            <Link to="/select-role" className="hover:underline">Зарегистрироваться</Link>
            {user ? (
              <Link to="/profile" className="hover:underline">Профиль</Link>
            ) : (
              <Link to="/login" className="hover:underline">Войти</Link>
            )}
          </div>
          <div className="flex space-x-4">
            <a href="#"><Facebook className="w-5 h-5 text-gray-500 hover:text-blue-600" /></a>
            <a href="#"><Twitter className="w-5 h-5 text-gray-500 hover:text-blue-400" /></a>
            <a href="#"><Linkedin className="w-5 h-5 text-gray-500 hover:text-blue-700" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:8000/api/auth/login/",
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (onLogin) onLogin(res.data.user);
      navigate("/profile");
    } catch (err) {
      alert(
        "Ошибка входа: " +
        (err.response?.data?.non_field_errors || "Неизвестная ошибка")
      );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-blue-50 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Вход</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Почта"
          className="w-full p-2 rounded border"
          required
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full p-2 rounded border"
          required
        />
        <button className="bg-blue-500 w-full text-white py-2 rounded-xl hover:bg-blue-600">
          Войти
        </button>
      </form>
      <div className="text-sm mt-4 text-center">
        Нет аккаунта? <Link to="/select-role" className="text-blue-600 underline">Зарегистрироваться</Link>
      </div>
    </div>
  );
}
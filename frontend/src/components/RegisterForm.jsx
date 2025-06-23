import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function RegisterForm({ onLogin }) {
  const { role } = useParams();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    password: "",
    password2: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!role || !['student', 'teacher'].includes(role)) {
      navigate('/select-role');
    }
  }, [role, navigate]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = { ...form, role };
      console.log("Отправляемые данные:", data);
      const res = await axios.post("http://localhost:8000/api/auth/register/", data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log("Ответ сервера:", res.data);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (onLogin) onLogin(res.data.user);
      navigate("/profile");
    } catch (err) {
      console.error("Ошибка регистрации:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        Object.values(err.response?.data || {}).flat().join(", ") ||
        "Ошибка при регистрации"
      );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-blue-50 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Регистрация {role === "student" ? "студента" : "преподавателя"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="last_name"
          type="text"
          placeholder="Фамилия"
          value={form.last_name}
          onChange={handleChange}
          className="w-full p-2 rounded border"
          required
        />
        <input
          name="first_name"
          type="text"
          placeholder="Имя"
          value={form.first_name}
          onChange={handleChange}
          className="w-full p-2 rounded border"
          required
        />
        <input
          name="middle_name"
          type="text"
          placeholder="Отчество"
          value={form.middle_name}
          onChange={handleChange}
          className="w-full p-2 rounded border"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Почта"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 rounded border"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 rounded border"
          required
        />
        <input
          name="password2"
          type="password"
          placeholder="Подтверждение пароля"
          value={form.password2}
          onChange={handleChange}
          className="w-full p-2 rounded border"
          required
        />
        {error && (
          <div className="text-red-500 text-sm text-center">
            {error}
          </div>
        )}
        <button className="bg-blue-500 w-full text-white py-2 rounded-xl hover:bg-blue-600">
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
}

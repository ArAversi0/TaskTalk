import { useNavigate } from "react-router-dom";

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="text-center mt-20 space-y-4">
      <h2 className="text-xl font-semibold">Зарегистрироваться как:</h2>
      <div className="flex justify-center gap-4">
        <button onClick={() => navigate("/register/student")} className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600">
          Студент
        </button>
        <button onClick={() => navigate("/register/teacher")} className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600">
          Преподаватель
        </button>
      </div>
    </div>
  );
}
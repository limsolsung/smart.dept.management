import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Calendar,
  ClipboardList,
  PieChart,
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  MessageCircle,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Save,
  FileText,
  Download,
  Edit,
  Trash2,
  X,
  Sparkles,
  Send,
  Bot,
  GraduationCap,
  DollarSign,
  FolderOpen,
  CheckSquare,
  BarChart2,
  AlertCircle,
  MapPin,
  Cake,
  RefreshCw,
  Copy,
  User,
  Clock,
  Wifi,
  Filter,
  Tag,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Target,
  LogOut,
  ArrowRight,
  Activity,
  ShieldCheck,
  LayoutDashboard,
  Menu,
} from "lucide-react";

// Firebase 라이브러리 임포트
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

// -------------------- [중요] Firebase 설정 --------------------
const firebaseConfig = {
  apiKey: "AIzaSyCbGFAIRZ1PIPLZ0ZeKzcLny4kEVjo41NI",
  authDomain: "youth-ministry-os.firebaseapp.com",
  projectId: "youth-ministry-os",
  storageBucket: "youth-ministry-os.firebasestorage.app",
  messagingSenderId: "119421514094",
  appId: "1:119421514094:web:1caf835fff780172fdd17f",
  measurementId: "G-1VE5WLTWNQ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// [FIX] appId 안전 처리
const rawAppId =
  typeof __app_id !== "undefined" ? __app_id : "youth-ministry-app";
const appId = rawAppId.replace(/\//g, "_");

// 메인 관리자 앱 컴포넌트
export default function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);

  // 모바일 메뉴 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 부서 이름 관리
  const [deptName, setDeptName] = useState(
    () => localStorage.getItem("deptName") || "우리교회 중고등부"
  );

  // --- 데이터 상태 ---
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [finances, setFinances] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [visitLogs, setVisitLogs] = useState([]);
  const [worshipChecklist, setWorshipChecklist] = useState([]);

  // 1. 인증 처리
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        setAppReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. 데이터 구독
  useEffect(() => {
    if (!user) return;
    const getColl = (name) =>
      collection(db, "artifacts", appId, "users", user.uid, name);

    const unsubs = [
      onSnapshot(getColl("students"), (s) => {
        setStudents(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(getColl("teachers"), (s) =>
        setTeachers(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(getColl("finances"), (s) =>
        setFinances(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(getColl("schedules"), (s) =>
        setSchedules(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(getColl("visitLogs"), (s) =>
        setVisitLogs(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(getColl("worshipChecklist"), (s) => {
        const list = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort(
          (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );
        setWorshipChecklist(list);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [user]);

  // --- 핸들러들 ---
  const handleEditDeptName = () => {
    const newName = prompt(
      "우리 부서 이름을 입력해주세요 (예: 고등부, 청년부):",
      deptName
    );
    if (newName) {
      setDeptName(newName);
      localStorage.setItem("deptName", newName);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Failed:", error);
      alert("로그인에 실패했습니다.");
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Guest Login Failed:", error);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      await signOut(auth);
      setAppReady(false);
      setStudents([]);
      setTeachers([]);
      setFinances([]);
      setSchedules([]);
      setVisitLogs([]);
      setWorshipChecklist([]);
    }
  };

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setIsMobileMenuOpen(false);
  };

  // --- CRUD Helper ---
  const addItem = async (col, data) => {
    if (!user) return;
    await addDoc(collection(db, "artifacts", appId, "users", user.uid, col), {
      ...data,
      createdAt: serverTimestamp(),
    });
  };
  const updateItem = async (col, id, data) => {
    if (!user) return;
    await updateDoc(
      doc(db, "artifacts", appId, "users", user.uid, col, id),
      data
    );
  };
  const deleteItem = async (col, id) => {
    if (!user) return;
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "artifacts", appId, "users", user.uid, col, id));
    }
  };
  const deleteChecklistItem = async (id) => {
    if (!user) return;
    await deleteDoc(
      doc(db, "artifacts", appId, "users", user.uid, "worshipChecklist", id)
    );
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center animate-pulse">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
            <LayoutDashboard className="text-white w-10 h-10" />
          </div>
          <p className="text-indigo-900 font-bold text-lg">스마트 부서 관리</p>
          <p className="text-indigo-400 text-sm mt-2">시스템 접속 중...</p>
        </div>
      </div>
    );

  if (!appReady) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg transform hover:scale-105 transition duration-500">
            <LayoutDashboard className="text-white w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            스마트 부서 관리
          </h1>
          <p className="text-indigo-200 mb-8 text-sm font-light">
            간단하고, 스마트하게.
          </p>
          <div className="space-y-3 mb-8">
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition shadow-lg flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span>구글 계정으로 시작하기</span>
              <div className="absolute right-4 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition">
                권장
              </div>
            </button>
            <button
              onClick={handleGuestLogin}
              className="w-full bg-indigo-600/50 text-indigo-100 font-medium py-3.5 rounded-xl hover:bg-indigo-600/70 transition flex items-center justify-center gap-2 border border-indigo-500/30"
            >
              <User size={18} /> 게스트로 체험하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <DashboardView
            students={students}
            schedules={schedules}
            finances={finances}
            onNavigate={handleMenuClick}
          />
        );
      case "students":
        return (
          <StudentListView
            students={students}
            onAdd={(d) =>
              addItem("students", { ...d, attendance: 0, lastVisit: "-" })
            }
            onUpdate={(d) => updateItem("students", d.id, d)}
            onDelete={(id) => deleteItem("students", id)}
          />
        );
      case "teachers":
        return (
          <TeacherListView
            teachers={teachers}
            onAdd={(d) => addItem("teachers", d)}
            onUpdate={(d) => updateItem("teachers", d.id, d)}
            onDelete={(id) => deleteItem("teachers", id)}
          />
        );
      case "attendance":
        return (
          <AttendanceView
            students={students}
            updateStudent={(d) => updateItem("students", d.id, d)}
          />
        );
      case "counseling":
        return (
          <CounselingView
            students={students}
            visitLogs={visitLogs}
            onAddLog={(d) => addItem("visitLogs", d)}
            onDeleteLog={(id) => deleteItem("visitLogs", id)}
          />
        );
      case "schedule":
        return (
          <ScheduleView
            schedules={schedules}
            onAdd={(d) => addItem("schedules", d)}
            onDelete={(id) => deleteItem("schedules", id)}
            checklist={worshipChecklist}
            onAddChecklist={(text) =>
              addItem("worshipChecklist", { text, completed: false })
            }
            onToggleChecklist={(item) =>
              updateItem("worshipChecklist", item.id, {
                completed: !item.completed,
              })
            }
            onDeleteChecklist={(id) => deleteChecklistItem(id)}
          />
        );
      case "finance":
        return (
          <FinanceView
            finances={finances}
            onAdd={(d) => addItem("finances", d)}
            onDelete={(id) => deleteItem("finances", id)}
          />
        );
      case "statistics":
        return <StatisticsView students={students} finances={finances} />;
      case "ai-assistant":
        return <AIAssistantView students={students} />;
      default:
        return (
          <DashboardView
            students={students}
            schedules={schedules}
            finances={finances}
            onNavigate={setActiveMenu}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-indigo-900 text-white flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:static md:inset-auto
      `}
      >
        <div className="p-6 border-b border-indigo-800 bg-indigo-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-300 mb-1">
              <LayoutDashboard size={16} />
              <span className="text-xs font-bold tracking-wider uppercase">
                Smart Ministry
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-indigo-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div
            onClick={handleEditDeptName}
            className="group cursor-pointer relative mt-2"
          >
            <h1 className="text-xl font-bold text-white leading-tight group-hover:text-indigo-100 transition pr-4">
              {deptName}
            </h1>
            <div className="absolute right-0 top-1 opacity-0 group-hover:opacity-100 transition text-indigo-400">
              <Edit size={14} />
            </div>
            <p className="text-xs text-indigo-400 mt-1 font-light">
              통합 관리 시스템
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem
            icon={<PieChart size={18} />}
            label="통합 대시보드"
            active={activeMenu === "dashboard"}
            onClick={() => handleMenuClick("dashboard")}
          />
          <div className="pt-4 pb-2 text-xs font-bold text-indigo-400 px-4 uppercase tracking-wider">
            Members
          </div>
          <SidebarItem
            icon={<Users size={18} />}
            label="학생 명부"
            active={activeMenu === "students"}
            onClick={() => handleMenuClick("students")}
          />
          <SidebarItem
            icon={<GraduationCap size={18} />}
            label="교사 관리"
            active={activeMenu === "teachers"}
            onClick={() => handleMenuClick("teachers")}
          />
          <SidebarItem
            icon={<Calendar size={18} />}
            label="출석부"
            active={activeMenu === "attendance"}
            onClick={() => handleMenuClick("attendance")}
          />
          <div className="pt-4 pb-2 text-xs font-bold text-indigo-400 px-4 uppercase tracking-wider">
            Ministry
          </div>
          <SidebarItem
            icon={<CheckSquare size={18} />}
            label="일정 및 행사"
            active={activeMenu === "schedule"}
            onClick={() => handleMenuClick("schedule")}
          />
          <SidebarItem
            icon={<MessageCircle size={18} />}
            label="심방 일지"
            active={activeMenu === "counseling"}
            onClick={() => handleMenuClick("counseling")}
          />
          <SidebarItem
            icon={<DollarSign size={18} />}
            label="재정 관리"
            active={activeMenu === "finance"}
            onClick={() => handleMenuClick("finance")}
          />
          <div className="pt-4 pb-2 text-xs font-bold text-indigo-400 px-4 uppercase tracking-wider">
            Insights
          </div>
          <SidebarItem
            icon={<BarChart2 size={18} />}
            label="통계 보고서"
            active={activeMenu === "statistics"}
            onClick={() => handleMenuClick("statistics")}
          />
          <SidebarItem
            icon={<Sparkles size={18} className="text-yellow-300" />}
            label="AI 사역 비서"
            active={activeMenu === "ai-assistant"}
            onClick={() => handleMenuClick("ai-assistant")}
            isSpecial={true}
          />
        </nav>

        <div className="p-4 bg-indigo-950 border-t border-indigo-900">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  user?.isAnonymous ? "bg-gray-500" : "bg-green-500"
                }`}
              >
                {user?.isAnonymous
                  ? "G"
                  : user?.email?.[0].toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">
                  {user?.isAnonymous ? "게스트" : "관리자"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-indigo-800 rounded-lg text-indigo-300 hover:text-white transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 w-full">
        <header className="bg-white shadow-sm p-4 z-10 flex justify-between items-center h-16 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-700 truncate">
              {activeMenu === "dashboard" && "📊 대시보드"}
              {activeMenu === "students" && "🗂️ 학생 명부"}
              {activeMenu === "teachers" && "👨‍🏫 교사 관리"}
              {activeMenu === "attendance" && "📅 출석부"}
              {activeMenu === "schedule" && "🗓️ 일정 관리"}
              {activeMenu === "finance" && "💰 재정 관리"}
              {activeMenu === "statistics" && "📈 통계"}
              {activeMenu === "ai-assistant" && "🤖 AI 비서"}
            </h2>
          </div>
          <div className="flex items-center">
            <span
              className={`text-xs px-2 py-1 rounded font-bold flex items-center gap-1 ${
                user?.isAnonymous
                  ? "bg-gray-200 text-gray-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <Activity size={12} />{" "}
              <span className="hidden sm:inline">
                {user?.isAnonymous ? "게스트" : "동기화 중"}
              </span>
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, isSpecial }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
        active
          ? "bg-indigo-700 text-white font-bold shadow-lg"
          : isSpecial
          ? "text-yellow-100 hover:bg-indigo-800 hover:text-white font-medium"
          : "text-indigo-300 hover:bg-indigo-800 hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, change }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase">{title}</p>
          <h3 className="text-xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <p className="text-xs text-gray-400">{change}</p>
    </div>
  );
}

function DashboardView({ students, schedules, finances, onNavigate }) {
  const totalStudents = students.length;
  const birthdayStudents = students.filter(
    (s) => s.birth && s.birth.startsWith("06")
  );
  const longTermAbsent = students.filter((s) => s.attendance < 50);
  const totalIncome = finances
    .filter((f) => f.type === "수입")
    .reduce((acc, cur) => acc + parseInt(cur.amount || 0), 0);
  const totalExpense = finances
    .filter((f) => f.type === "지출")
    .reduce((acc, cur) => acc + parseInt(cur.amount || 0), 0);
  const balance = totalIncome - totalExpense;
  const handleSendSMS = (name) =>
    alert(
      `[메시지 전송 완료]\n수신: ${name} 학생\n내용: 생일 축하해! 🎉 - 전도사님`
    );
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="총 재적 인원"
          value={`${totalStudents}명`}
          icon={<Users className="text-blue-500" />}
          change="실시간"
        />
        <StatCard
          title="평균 출석률"
          value={`${
            students.length > 0
              ? Math.round(
                  students.reduce((acc, s) => acc + (s.attendance || 0), 0) /
                    students.length
                )
              : 0
          }%`}
          icon={<UserCheck className="text-green-500" />}
          change="최근"
        />
        <StatCard
          title="이번 달 생일"
          value={`${birthdayStudents.length}명`}
          icon={<Sparkles className="text-yellow-500" />}
          change="축하 필요"
        />
        <StatCard
          title="현재 잔액"
          value={`₩${balance.toLocaleString()}`}
          icon={<DollarSign className="text-purple-500" />}
          change="예정 있음"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              ✅ 이번 주 중점 사항
            </h3>
            <div className="space-y-3">
              <div
                className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer"
                onClick={() => onNavigate("students")}
              >
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-red-700 text-sm truncate">
                    장기 결석자 관리 ({longTermAbsent.length}명)
                  </p>
                  <p className="text-xs text-red-500 truncate">
                    {longTermAbsent.length > 0
                      ? `${longTermAbsent[0].name} 외`
                      : "현재 없음"}
                  </p>
                </div>
                <ChevronRight size={16} className="text-red-300" />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-full">
            <h3 className="font-bold text-lg mb-4">🗓️ 주요 일정</h3>
            <ul className="space-y-3">
              {schedules.map((sch) => (
                <li key={sch.id} className="flex gap-3 items-center">
                  <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-2 min-w-[50px]">
                    <span className="text-xs font-bold text-gray-500">
                      {sch.date.slice(5, 7)}월
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {sch.date.slice(8, 10)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{sch.title}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        sch.status === "준비중"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {sch.status}
                    </span>
                  </div>
                </li>
              ))}{" "}
              {schedules.length === 0 && (
                <p className="text-gray-400 text-sm">일정이 없습니다.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentListView({ students, onAdd, onUpdate, onDelete }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    grade: "중1",
    class: "",
    phone: "",
    parentsPhone: "",
    birth: "",
    address: "",
    faithState: "초신자",
    prayerTopic: "",
    notes: "",
  });

  const filteredStudents = students.filter(
    (s) =>
      s.name.includes(searchTerm) ||
      s.class.includes(searchTerm) ||
      s.grade.includes(searchTerm)
  );
  const sortedStudents = [...filteredStudents].sort((a, b) =>
    (a[sortKey] || "")
      .toString()
      .localeCompare((b[sortKey] || "").toString(), "ko")
  );

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: "",
      grade: "중1",
      class: "",
      phone: "",
      parentsPhone: "",
      birth: "",
      address: "",
      faithState: "초신자",
      prayerTopic: "",
      notes: "",
    });
    setIsModalOpen(true);
  };
  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({ address: "", notes: "", ...student });
    setIsModalOpen(true);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingStudent) {
      onUpdate({ ...formData, id: editingStudent.id });
    } else {
      onAdd(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 bg-gray-50">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="검색"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={openAddModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex-shrink-0"
          >
            <Plus size={20} />
          </button>
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm w-full md:w-auto"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
        >
          <option value="name">이름순</option>
          <option value="grade">학년순</option>
          <option value="class">반별</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="p-4">이름/정보</th>
              <th className="p-4">연락처</th>
              <th className="p-4">상태</th>
              <th className="p-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {sortedStudents.map((s) => (
              <tr key={s.id}>
                <td className="p-4">
                  <div className="font-bold text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    {s.grade} | {s.class}
                  </div>
                </td>
                <td className="p-4">
                  <div>📱 {s.phone}</div>
                  <div className="text-xs text-gray-400">
                    P: {s.parentsPhone || "-"}
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100">
                    {s.faithState}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => openEditModal(s)}
                    className="text-blue-600 p-2"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(s.id)}
                    className="text-red-500 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">학생 정보</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="w-full border p-3 rounded-lg"
                placeholder="이름"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <div className="flex gap-2">
                <select
                  className="w-full border p-3 rounded-lg"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                >
                  <option>중1</option>
                  <option>중2</option>
                  <option>중3</option>
                  <option>고1</option>
                  <option>고2</option>
                  <option>고3</option>
                </select>
                <input
                  className="w-full border p-3 rounded-lg"
                  placeholder="반"
                  value={formData.class}
                  onChange={(e) =>
                    setFormData({ ...formData, class: e.target.value })
                  }
                />
              </div>
              <input
                className="w-full border p-3 rounded-lg"
                placeholder="연락처"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <input
                className="w-full border p-3 rounded-lg"
                placeholder="부모님 연락처"
                value={formData.parentsPhone}
                onChange={(e) =>
                  setFormData({ ...formData, parentsPhone: e.target.value })
                }
              />
              <input
                className="w-full border p-3 rounded-lg"
                placeholder="주소"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
              <textarea
                className="w-full border p-3 rounded-lg resize-none"
                placeholder="비고 (특이사항)"
                rows="3"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">
                저장
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherListView({ teachers, onAdd, onUpdate, onDelete }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "교사",
    charge: "",
    phone: "",
    birth: "",
    address: "",
    notes: "",
  });

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({
      name: "",
      role: "교사",
      charge: "",
      phone: "",
      birth: "",
      address: "",
      notes: "",
    });
    setIsModalOpen(true);
  };
  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({ birth: "", address: "", notes: "", ...teacher });
    setIsModalOpen(true);
  };
  const openDetailModal = (teacher) => {
    setViewingTeacher(teacher);
  };
  const closeDetailModal = () => {
    setViewingTeacher(null);
  };
  const switchToEditFromDetail = () => {
    const t = viewingTeacher;
    closeDetailModal();
    openEditModal(t);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTeacher) {
      onUpdate({ ...formData, id: editingTeacher.id });
    } else {
      onAdd(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <GraduationCap /> 교사 명단
        </h3>
        <button
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <Plus size={16} /> 등록
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((t) => (
          <div
            key={t.id}
            onClick={() => openDetailModal(t)}
            className="relative group border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition bg-white cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
              {t.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-800 truncate">{t.name}</h4>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 whitespace-nowrap">
                  {t.role}
                </span>
              </div>
              <p className="text-sm text-indigo-600 font-medium truncate">
                {t.charge}
              </p>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Phone size={10} /> {t.phone}
              </p>
            </div>
          </div>
        ))}
      </div>
      {viewingTeacher && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeDetailModal}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDetailModal}
              className="absolute top-4 right-4 text-gray-400"
            >
              <X size={24} />
            </button>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-3xl font-bold mx-auto mb-3">
                {viewingTeacher.name[0]}
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {viewingTeacher.name}
              </h3>
              <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold mt-1">
                {viewingTeacher.role}
              </span>
            </div>
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">연락처</p>
                  <p className="font-medium text-gray-700">
                    {viewingTeacher.phone || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">담당</p>
                  <p className="font-medium text-gray-700">
                    {viewingTeacher.charge || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">주소</p>
                  <p className="font-medium text-gray-700 text-sm">
                    {viewingTeacher.address || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">비고</p>
                  <p className="font-medium text-gray-700 text-sm whitespace-pre-wrap">
                    {viewingTeacher.notes || "-"}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-2">
              <button
                onClick={switchToEditFromDetail}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Edit size={18} /> 수정
              </button>
              <button
                onClick={() => {
                  if (window.confirm("삭제하시겠습니까?")) {
                    onDelete(viewingTeacher.id);
                    closeDetailModal();
                  }
                }}
                className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> 삭제
              </button>
            </div>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingTeacher ? "교사 정보 수정" : "교사 등록"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="w-full border p-3 rounded-lg"
                placeholder="이름"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <div className="flex gap-2">
                <select
                  className="w-1/3 border p-3 rounded-lg"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option>교사</option>
                  <option>부장</option>
                  <option>담임</option>
                  <option>보조</option>
                  <option>재정</option>
                </select>
                <input
                  className="w-2/3 border p-3 rounded-lg"
                  placeholder="담당"
                  value={formData.charge}
                  onChange={(e) =>
                    setFormData({ ...formData, charge: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="border p-3 rounded-lg"
                  placeholder="연락처"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <input
                  className="border p-3 rounded-lg"
                  placeholder="생년월일"
                  value={formData.birth}
                  onChange={(e) =>
                    setFormData({ ...formData, birth: e.target.value })
                  }
                />
              </div>
              <input
                className="w-full border p-3 rounded-lg"
                placeholder="주소"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
              <textarea
                className="w-full border p-3 rounded-lg resize-none"
                rows="2"
                placeholder="비고 (특이사항)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">
                저장
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleView({
  schedules,
  onAdd,
  onDelete,
  checklist,
  onAddChecklist,
  onToggleChecklist,
  onDeleteChecklist,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    title: "",
    type: "예배",
    status: "준비중",
    details: "",
  });
  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const getDday = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "D-Day";
    if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
    return `D-${diffDays}`;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setIsModalOpen(false);
    setFormData({
      date: "",
      title: "",
      type: "예배",
      status: "준비중",
      details: "",
    });
  };
  const [newItem, setNewItem] = useState("");
  const handleAddItem = (e) => {
    if (e.key === "Enter" && newItem.trim()) {
      onAddChecklist(newItem);
      setNewItem("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">🗓️ 사역 캘린더</h3>
          <p className="text-sm text-gray-500">주요 일정과 준비 사항</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-indigo-600 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-md"
        >
          <Plus size={18} /> 일정 추가
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {sortedSchedules.map((sch) => {
            const dDay = getDday(sch.date);
            const isUpcoming = !dDay.startsWith("D+");
            return (
              <div
                key={sch.id}
                className={`relative bg-white p-5 rounded-xl border-l-4 shadow-sm hover:shadow-md transition group ${
                  sch.type === "예배"
                    ? "border-l-indigo-500"
                    : sch.type === "행사"
                    ? "border-l-orange-500"
                    : "border-l-green-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center min-w-[60px] bg-gray-50 rounded-lg p-2">
                      <span className="text-xs font-bold text-gray-500">
                        {sch.date.slice(5, 7)}월
                      </span>
                      <span className="text-xl font-bold text-gray-800">
                        {sch.date.slice(8, 10)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                            sch.type === "예배"
                              ? "bg-indigo-400"
                              : sch.type === "행사"
                              ? "bg-orange-400"
                              : "bg-green-400"
                          }`}
                        >
                          {sch.type}
                        </span>
                        {isUpcoming && (
                          <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 rounded">
                            {dDay}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-800 text-lg">
                        {sch.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {sch.details || "상세 내용 없음"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        sch.status === "완료"
                          ? "bg-gray-200 text-gray-500"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {sch.status}
                    </span>
                    <button
                      onClick={() => onDelete(sch.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {schedules.length === 0 && (
            <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
              등록된 일정이 없습니다.
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
            <CheckSquare className="text-indigo-600" /> 예배 준비 체크리스트
          </h4>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="할 일 입력 후 엔터..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={handleAddItem}
            />
            <button
              onClick={() => {
                if (newItem.trim()) {
                  onAddChecklist(newItem);
                  setNewItem("");
                }
              }}
              className="bg-indigo-600 text-white px-3 rounded-lg"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {checklist.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                등록된 할 일이 없습니다.
              </p>
            )}
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group transition"
              >
                <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded"
                    checked={item.completed}
                    onChange={() => onToggleChecklist(item)}
                  />
                  <span
                    className={`text-sm font-medium transition ${
                      item.completed
                        ? "text-gray-400 line-through decoration-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {item.text}
                  </span>
                </label>
                <button
                  onClick={() => onDeleteChecklist(item.id)}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1 rounded-full hover:bg-red-50"
                  title="삭제"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">새 일정 등록</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    날짜
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full border p-3 rounded-lg"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    분류
                  </label>
                  <select
                    className="w-full border p-3 rounded-lg"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option>예배</option>
                    <option>행사</option>
                    <option>모임</option>
                    <option>심방</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  행사명
                </label>
                <input
                  required
                  placeholder="예: 여름 수련회"
                  className="w-full border p-3 rounded-lg"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  상세 내용 / 준비물
                </label>
                <textarea
                  rows="3"
                  placeholder="준비물, 장소 등..."
                  className="w-full border p-3 rounded-lg resize-none"
                  value={formData.details}
                  onChange={(e) =>
                    setFormData({ ...formData, details: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  진행 상태
                </label>
                <select
                  className="w-full border p-3 rounded-lg"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option>준비중</option>
                  <option>기획단계</option>
                  <option>확정</option>
                  <option>완료</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 py-3 rounded-lg font-bold text-gray-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceView({ finances, onAdd, onDelete }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "지출",
    category: "간식비",
    amount: "",
    memo: "",
  });
  const [monthFilter, setMonthFilter] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const filteredFinances = finances.filter((f) =>
    f.date.startsWith(monthFilter)
  );
  const totalIncome = filteredFinances
    .filter((f) => f.type === "수입")
    .reduce((acc, cur) => acc + parseInt(cur.amount || 0), 0);
  const totalExpense = filteredFinances
    .filter((f) => f.type === "지출")
    .reduce((acc, cur) => acc + parseInt(cur.amount || 0), 0);
  const balance = totalIncome - totalExpense;
  const expenseCategories = {};
  filteredFinances
    .filter((f) => f.type === "지출")
    .forEach((f) => {
      expenseCategories[f.category] =
        (expenseCategories[f.category] || 0) + parseInt(f.amount);
    });
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ ...formData, amount: parseInt(formData.amount) });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg">📅 재정 보고</h3>
          <input
            type="month"
            className="border p-1.5 rounded-lg text-sm font-bold"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-4 text-sm w-full md:w-auto justify-between">
          <div className="text-right">
            <p className="text-xs text-gray-400">수입</p>
            <p className="font-bold text-blue-600">
              +{totalIncome.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">지출</p>
            <p className="font-bold text-red-600">
              -{totalExpense.toLocaleString()}
            </p>
          </div>
          <div className="text-right border-l pl-4">
            <p className="text-xs text-gray-400">잔액</p>
            <p className="font-bold text-lg">{balance.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-700">📝 상세 입출금 내역</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-indigo-700 flex items-center gap-1"
            >
              <Plus size={14} /> 내역 추가
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="p-4">날짜</th>
                  <th className="p-4">구분</th>
                  <th className="p-4">항목</th>
                  <th className="p-4">적요</th>
                  <th className="p-4 text-right">금액</th>
                  <th className="p-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFinances.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-500">{f.date.slice(5)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          f.type === "수입"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {f.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      {f.category}
                    </td>
                    <td className="p-4 text-gray-500">{f.memo}</td>
                    <td
                      className={`p-4 text-right font-bold ${
                        f.type === "수입" ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      {parseInt(f.amount).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => onDelete(f.id)}>
                        <Trash2 size={14} className="text-gray-300" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <PieChart size={18} /> 지출 분석
            </h4>
            {Object.keys(expenseCategories).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                지출 내역이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(expenseCategories).map(([cat, amt]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-600">{cat}</span>
                      <span className="text-gray-500">
                        {amt.toLocaleString()}원 (
                        {Math.round((amt / totalExpense) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-red-400 h-2 rounded-full"
                        style={{ width: `${(amt / totalExpense) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-md text-white">
            <h4 className="font-bold text-sm opacity-80 mb-1">
              현재 재정 상태
            </h4>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-bold">
                {balance >= 0 ? "양호" : "부족"}
              </span>
              <span className="text-sm opacity-80 mb-1">
                ({monthFilter} 기준)
              </span>
            </div>
            <p className="text-xs opacity-70 mb-2">수입 대비 지출 비율</p>
            <div className="w-full bg-black bg-opacity-20 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${
                  totalExpense > totalIncome ? "bg-red-400" : "bg-green-400"
                }`}
                style={{
                  width: `${
                    totalIncome > 0
                      ? Math.min(100, (totalExpense / totalIncome) * 100)
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] mt-1 opacity-60">
              <span>0%</span>
              <span>50%</span>
              <span>100% (위험)</span>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">내역 등록</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                type="date"
                className="w-full border p-3 rounded-lg"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
              <div className="flex gap-2">
                <select
                  className="w-1/3 border p-3 rounded-lg"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option>수입</option>
                  <option>지출</option>
                </select>
                <input
                  className="w-2/3 border p-3 rounded-lg"
                  placeholder="항목"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                />
              </div>
              <input
                className="w-full border p-3 rounded-lg"
                type="number"
                placeholder="금액"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
              <input
                className="w-full border p-3 rounded-lg"
                placeholder="메모"
                value={formData.memo}
                onChange={(e) =>
                  setFormData({ ...formData, memo: e.target.value })
                }
              />
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">
                저장
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatisticsView({ students, finances }) {
  const gradeCounts = {};
  const genderCounts = { 남: 0, 여: 0 };
  const faithCounts = {};
  students.forEach((s) => {
    gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1;
    faithCounts[s.faithState] = (faithCounts[s.faithState] || 0) + 1;
    const gender = Math.random() > 0.5 ? "남" : "여";
    genderCounts[gender]++;
  });
  const attendanceTrend = [
    { label: "3주전", value: 75 },
    { label: "2주전", value: 82 },
    { label: "지난주", value: 78 },
    { label: "이번주", value: 85 },
  ];
  const totalIncome = finances
    .filter((f) => f.type === "수입")
    .reduce((acc, cur) => acc + parseInt(cur.amount || 0), 0);
  const totalExpense = finances
    .filter((f) => f.type === "지출")
    .reduce((acc, cur) => acc + parseInt(cur.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800">
          📈 목회 데이터 분석
        </h3>
        <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50">
          <Download size={16} /> 월간 보고서 다운로드
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-bold uppercase">총 재적</p>
          <p className="text-2xl font-bold text-blue-600">
            {students.length}명
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-bold uppercase">
            새가족(초신자)
          </p>
          <p className="text-2xl font-bold text-green-600">
            {faithCounts["초신자"] || 0}명
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-bold uppercase">재정 잔액</p>
          <p
            className={`text-xl font-bold ${
              balance >= 0 ? "text-indigo-600" : "text-red-600"
            }`}
          >
            {balance.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 font-bold uppercase">
            출석률(예상)
          </p>
          <p className="text-xl font-bold text-gray-700">
            {students.length > 0
              ? Math.round(
                  (students.reduce(
                    (a, c) => a + (c.attendance >= 50 ? 1 : 0),
                    0
                  ) /
                    students.length) *
                    100
                )
              : 0}
            %
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-sm text-gray-500 font-bold mb-4">
            학년별 인원 구성
          </h4>
          <div className="space-y-3">
            {["중1", "중2", "중3", "고1", "고2", "고3"].map((gr) => {
              const count = gradeCounts[gr] || 0;
              const total = students.length || 1;
              return (
                <div key={gr} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-8 text-gray-600">
                    {gr}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(count / total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {count}명
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-sm text-gray-500 font-bold mb-4">
            신앙 단계 분포
          </h4>
          <div className="space-y-3">
            {["초신자", "양육중", "헌신자", "무관심", "시험듦"].map((state) => {
              const count = faithCounts[state] || 0;
              const total = students.length || 1;
              let color = "bg-gray-400";
              if (state === "초신자") color = "bg-green-400";
              if (state === "헌신자") color = "bg-purple-400";
              if (state === "시험듦") color = "bg-red-400";
              if (state === "양육중") color = "bg-blue-400";
              return (
                <div key={state} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-12 text-gray-600">
                    {state}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${color} h-full rounded-full transition-all duration-1000`}
                      style={{ width: `${(count / total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {count}명
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <h4 className="text-lg font-bold mb-4">📊 부서 종합 현황표</h4>
        <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500 border-t border-b border-gray-200">
            <tr>
              <th className="p-3">구분</th>
              <th className="p-3">재적</th>
              <th className="p-3">출석(최근)</th>
              <th className="p-3">출석률</th>
              <th className="p-3">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="font-bold bg-indigo-50 text-indigo-900">
              <td className="p-3">전체 합계</td>
              <td className="p-3">{students.length}</td>
              <td className="p-3">
                {students.filter((s) => s.attendance >= 50).length}
              </td>
              <td className="p-3">
                {students.length > 0
                  ? Math.round(
                      (students.filter((s) => s.attendance >= 50).length /
                        students.length) *
                        100
                    )
                  : 0}
                %
              </td>
              <td className="p-3">-</td>
            </tr>
            {["중1", "중2", "중3", "고1", "고2", "고3"].map((gr) => {
              const gradeStudents = students.filter((s) => s.grade === gr);
              const count = gradeStudents.length;
              const present = gradeStudents.filter(
                (s) => s.attendance >= 50
              ).length;
              const rate = count > 0 ? Math.round((present / count) * 100) : 0;
              return (
                <tr key={gr} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{gr}</td>
                  <td className="p-3">{count}</td>
                  <td className="p-3">{present}</td>
                  <td className="p-3">{rate}%</td>
                  <td className="p-3 text-gray-400 text-xs"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttendanceView({ students, updateStudent }) {
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceMap, setAttendanceMap] = useState({});

  useEffect(() => {
    const initialMap = {};
    students.forEach((s) => {
      initialMap[s.id] = "absent";
    });
    setAttendanceMap((prev) => ({ ...initialMap, ...prev }));
  }, [students]);

  const filteredStudents = students.filter((s) => s.name.includes(searchQuery));
  const stats = {
    present: Object.values(attendanceMap).filter((v) => v === "present").length,
    late: Object.values(attendanceMap).filter((v) => v === "late").length,
    absent:
      students.length -
      Object.values(attendanceMap).filter((v) => v !== "absent").length,
  };
  const handleStatusChange = (id, status) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: status }));
  };
  const handleSave = () => {
    alert(
      `${currentDate} 출석이 저장되었습니다!\n출석:${stats.present}, 지각:${stats.late}, 결석:${stats.absent}`
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <button
            onClick={() =>
              setCurrentDate((d) => {
                const date = new Date(d);
                date.setDate(date.getDate() - 7);
                return date.toISOString().slice(0, 10);
              })
            }
          >
            <ChevronLeft />
          </button>
          <input
            type="date"
            className="font-bold text-lg bg-transparent outline-none text-center"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
          />
          <button
            onClick={() =>
              setCurrentDate((d) => {
                const date = new Date(d);
                date.setDate(date.getDate() + 7);
                return date.toISOString().slice(0, 10);
              })
            }
          >
            <ChevronRight />
          </button>
        </div>
        <input
          type="text"
          placeholder="이름 검색"
          className="w-full bg-gray-100 p-2 rounded-lg text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex justify-between text-xs font-bold pt-2 border-t text-center">
          <div className="text-green-600 flex-1 border-r">
            출석 {stats.present}
          </div>
          <div className="text-yellow-600 flex-1 border-r">
            지각 {stats.late}
          </div>
          <div className="text-red-600 flex-1">결석 {stats.absent}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredStudents.map((s) => {
          const status = attendanceMap[s.id] || "absent";
          return (
            <div
              key={s.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      status === "present"
                        ? "bg-green-500"
                        : status === "late"
                        ? "bg-yellow-500"
                        : "bg-gray-300"
                    }`}
                  >
                    {s.name[0]}
                  </div>
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="text-xs text-gray-500">
                      {s.grade} {s.class}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    status === "present"
                      ? "bg-green-100 text-green-700"
                      : status === "late"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {status === "present"
                    ? "출석"
                    : status === "late"
                    ? "지각"
                    : "결석"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatusChange(s.id, "present")}
                  className={`py-2 rounded-lg text-xs font-bold ${
                    status === "present"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  출석
                </button>
                <button
                  onClick={() => handleStatusChange(s.id, "late")}
                  className={`py-2 rounded-lg text-xs font-bold ${
                    status === "late"
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  지각
                </button>
                <button
                  onClick={() => handleStatusChange(s.id, "absent")}
                  className={`py-2 rounded-lg text-xs font-bold ${
                    status === "absent"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  결석
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={handleSave}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition"
      >
        <Save size={24} />
      </button>
    </div>
  );
}

function CounselingView({ students, visitLogs, onAddLog, onDeleteLog }) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [logContent, setLogContent] = useState("");
  const handleAddLog = () => {
    if (!selectedStudentId) return;
    const student = students.find((s) => s.id === selectedStudentId);
    onAddLog({
      studentId: selectedStudentId,
      studentName: student?.name,
      date: new Date().toISOString().slice(0, 10),
      type: "면담",
      content: logContent,
    });
    setLogContent("");
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4">
      <div className="md:w-1/3 bg-white p-4 rounded-xl shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-lg">일지 작성</h3>
        <select
          className="w-full border p-3 rounded-lg bg-white"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          <option value="">학생 선택</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <textarea
          className="w-full border p-3 rounded-lg flex-1 resize-none"
          placeholder="내용 입력..."
          value={logContent}
          onChange={(e) => setLogContent(e.target.value)}
        />
        <button
          onClick={handleAddLog}
          className="bg-indigo-600 text-white py-3 rounded-lg font-bold"
        >
          저장
        </button>
      </div>
      <div className="md:w-2/3 bg-white p-4 rounded-xl shadow-sm overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">히스토리</h3>
        <div className="space-y-4">
          {visitLogs.map((log) => (
            <div
              key={log.id}
              className="border-l-4 border-indigo-500 pl-4 py-1"
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold">{log.studentName}</span>
                <span className="text-gray-400">{log.date}</span>
              </div>
              <p className="text-sm text-gray-600">{log.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIAssistantView({ students }) {
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "ai",
      text: "전도사님, 안녕하세요! 무엇을 도와드릴까요?\n심방 문자, 설교 자료, 행사 기획 등 사역에 필요한 모든 것을 말씀해 주세요. 😊",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // 설정 상태
  const [selectedCategory, setSelectedCategory] = useState("심방/소통");
  const [selectedTone, setSelectedTone] = useState("친근하게");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const chatContainerRef = useRef(null);

  // 카테고리 및 템플릿
  const categories = {
    "심방/소통": [
      "장기 결석자 안부 문자",
      "생일 축하 메시지",
      "시험 기간 응원 카톡",
      "새가족 환영 인사",
    ],
    "설교/공과": [
      "본문 묵상 질문 3가지",
      "설교 예화 추천해줘",
      "아이스브레이킹 게임 추천",
      "공과 적용점 찾기",
    ],
    "행사/기획": [
      "레크리에이션 아이디어",
      "수련회 프로그램 기획",
      "반별 단합대회 아이디어",
      "절기 행사 기획안",
    ],
    "행정/문서": [
      "주보 인사말 작성",
      "가정통신문 문구",
      "교사 회의 안건 정리",
      "예산 기획안 초안",
    ],
  };

  const toneOptions = [
    "친근하게",
    "정중하게",
    "목회적으로",
    "유머러스하게",
    "간결하게",
  ];

  // 스크롤 자동 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const generateContent = async () => {
    if (!prompt.trim()) return;

    // 사용자 메시지 추가
    const userMessage = { role: "user", text: prompt };
    setChatHistory((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);

    // 컨텍스트 구성 (학생 정보)
    let contextInfo = "";
    if (selectedStudentId) {
      const student = students.find((s) => s.id === selectedStudentId);
      if (student) {
        contextInfo = `[대상 학생 정보: 이름-${student.name}, 학년-${
          student.grade
        }, 반-${student.class}, 신앙상태-${student.faithState}, 기도제목-${
          student.prayerTopic || "없음"
        }, 특이사항-${student.notes || "없음"}]`;
      }
    }

    // 시스템 프롬프트
    const systemInstruction = `
      당신은 교육부서 사역을 돕는 유능하고 지혜로운 AI 전도사입니다. 
      다음 조건에 맞춰 답변해 주세요:
      1. 말투(Tone): ${selectedTone}
      2. 상황: 한국 교회 교육부서 사역 현장
      3. 대상 정보가 있다면 그 정보를 적극 반영해서 개인화된 내용을 작성해 주세요.
      ${contextInfo ? `참고할 대상 정보: ${contextInfo}` : ""}
    `;

    try {
      const apiKey = "AIzaSyAM9WUqbMMc8WqaRyFUbSH5c3amNgQi1kE"; // 런타임 키 사용
      const apiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text:
                      systemInstruction + "\n\n요청사항: " + userMessage.text,
                  },
                ],
              },
            ],
          }),
        }
      );
      const data = await apiResponse.json();
      const aiResponseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "죄송해요, 응답을 생성하는 데 문제가 생겼어요.";

      setChatHistory((prev) => [...prev, { role: "ai", text: aiResponseText }]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: "오류가 발생했습니다. 다시 시도해 주세요." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (text) => {
    setPrompt(text);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 md:gap-6">
      {/* 왼쪽: 설정 및 템플릿 (모바일에서는 위로 올라감) */}
      <div className="md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-1 md:pr-2 h-1/3 md:h-full">
        {/* 설정 박스 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block flex items-center gap-1">
              <Bot size={14} /> 말투 설정
            </label>
            <div className="flex flex-wrap gap-2">
              {toneOptions.map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition border ${
                    selectedTone === tone
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 block flex items-center gap-1">
              <User size={14} /> 대상 학생 (선택)
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">선택 안 함 (일반적인 내용)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 템플릿 박스 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
          <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
            <Sparkles size={16} /> 추천 템플릿
          </h4>

          {/* 카테고리 탭 (가로 스크롤) */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
            {Object.keys(categories).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition border ${
                  selectedCategory === cat
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {categories[selectedCategory].map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(item)}
                className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 text-xs md:text-sm transition border border-gray-100 group flex justify-between items-center"
              >
                {item}
                <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition">
                  <ChevronRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽: 채팅 인터페이스 */}
      <div className="md:w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-2/3 md:h-full">
        <div
          className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 space-y-4 md:space-y-6"
          ref={chatContainerRef}
        >
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 md:gap-4 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-1">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-[85%] md:max-w-[80%] p-3 md:p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white">
                <Bot size={16} />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 md:p-4 bg-white border-t border-gray-200">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="메시지를 입력하거나 템플릿을 선택하세요."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 md:p-4 pr-12 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-16 md:h-24 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateContent();
                }
              }}
            />
            <div className="absolute right-2 bottom-2 md:right-3 md:bottom-3 flex gap-2">
              <button
                onClick={() =>
                  setChatHistory([
                    {
                      role: "ai",
                      text: "대화가 초기화되었습니다. 무엇을 도와드릴까요?",
                    },
                  ])
                }
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="대화 초기화"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={generateContent}
                disabled={isLoading || !prompt.trim()}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition shadow-sm"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { 
  LayoutDashboard, 
  Users, 
  User, 
  BookOpen, 
  Calendar,
  Clock, 
  BarChart3, 
  LogOut,
  School,
  CalendarDays
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  role: 'admin' | 'teacher' | 'parent';
}

const Layout = ({ children, role }: LayoutProps) => {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { path: '/admin/dashboard', label: '仪表板', icon: LayoutDashboard },
        { path: '/admin/teachers', label: '师资管理', icon: Users },
        { path: '/admin/students', label: '学员管理', icon: User },
        { path: '/admin/courses', label: '课程管理', icon: BookOpen },
        { path: '/admin/schedules', label: '排班列表', icon: Calendar },
        { path: '/admin/schedule-calendar', label: '课程表', icon: CalendarDays },
        { path: '/admin/lessons', label: '课时记录', icon: Clock },
        { path: '/admin/reports', label: '数据报表', icon: BarChart3 },
      ];
    } else if (role === 'teacher') {
      return [
        { path: '/teacher/schedule', label: '排班列表', icon: Calendar },
        { path: '/teacher/schedule-calendar', label: '我的课表', icon: CalendarDays },
        { path: '/teacher/students', label: '授课学员', icon: User },
        { path: '/teacher/checkin', label: '课时核销', icon: Clock },
      ];
    } else {
      return [
        { path: '/parent/profile', label: '子女档案', icon: User },
        { path: '/parent/schedule', label: '上课安排', icon: Calendar },
        { path: '/parent/lessons', label: '剩余课时', icon: Clock },
        { path: '/parent/comments', label: '历史评语', icon: BookOpen },
      ];
    }
  };

  const getRoleName = () => {
    if (role === 'admin') return '管理员';
    if (role === 'teacher') return '教师';
    return '家长';
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <School className="w-8 h-8" />
            <h1 className="text-xl font-bold">教务系统</h1>
          </div>
          
          <div className="mb-6 p-4 bg-white/10 rounded-lg">
            <p className="text-sm text-blue-200">当前角色</p>
            <p className="font-medium">{getRoleName()}</p>
            <p className="text-sm text-blue-200">{user?.name}</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-64 p-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b px-8 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {navItems.find(item => item.path === location.pathname)?.label || '教务系统'}
            </h2>
            <div className="text-gray-600">
              欢迎，{user?.name}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

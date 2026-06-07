import { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Users } from 'lucide-react';
import { fetchAPI } from '../lib/api';

interface LoginResponse {
  success: boolean;
  user: any;
  message?: string;
}

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'parent' | null>(null);
  const [error, setError] = useState('');
  const { setUser } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = await fetchAPI<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (data.success) {
        setUser(data.user);
        // 根据角色导航到对应页面
        if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (data.user.role === 'teacher') {
          navigate('/teacher/schedule');
        } else {
          navigate('/parent/profile');
        }
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err) {
      setError('登录失败，请稍后重试');
    }
  };

  const getDefaultCredentials = () => {
    if (selectedRole === 'admin') return { username: 'admin', password: 'admin123' };
    if (selectedRole === 'teacher') return { username: 'teacher1', password: 'teacher123' };
    if (selectedRole === 'parent') return { username: 'parent1', password: 'parent123' };
    return { username: '', password: '' };
  };

  const handleRoleSelect = (role: 'admin' | 'teacher' | 'parent') => {
    setSelectedRole(role);
    const creds = getDefaultCredentials();
    setUsername(creds.username);
    setPassword(creds.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">教务管理系统</h1>
          <p className="text-blue-200">请选择您的角色登录</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => handleRoleSelect('admin')}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedRole === 'admin'
                ? 'border-white bg-white/20'
                : 'border-white/30 bg-white/10 hover:bg-white/15'
            }`}
          >
            <Shield className="w-10 h-10 mx-auto mb-2 text-white" />
            <p className="text-white font-medium">管理员</p>
          </button>
          <button
            onClick={() => handleRoleSelect('teacher')}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedRole === 'teacher'
                ? 'border-white bg-white/20'
                : 'border-white/30 bg-white/10 hover:bg-white/15'
            }`}
          >
            <User className="w-10 h-10 mx-auto mb-2 text-white" />
            <p className="text-white font-medium">教师</p>
          </button>
          <button
            onClick={() => handleRoleSelect('parent')}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedRole === 'parent'
                ? 'border-white bg-white/20'
                : 'border-white/30 bg-white/10 hover:bg-white/15'
            }`}
          >
            <Users className="w-10 h-10 mx-auto mb-2 text-white" />
            <p className="text-white font-medium">家长</p>
          </button>
        </div>

        {selectedRole && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              {selectedRole === 'admin' ? '管理员' : selectedRole === 'teacher' ? '教师' : '家长'}登录
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                登录
              </button>
            </form>
            <p className="text-gray-500 text-xs text-center mt-4">
              测试账号已自动填充
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

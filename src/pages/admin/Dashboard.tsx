import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Users, User, BookOpen, Clock, Calendar } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface DashboardData {
  teacherCount: number;
  studentCount: number;
  courseCount: number;
  lessonCount: number;
  todayLessons: number;
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchAPI<DashboardData>('/api/auth/dashboard');
        setData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data');
      }
    };
    fetchData();
  }, []);

  const stats = [
    { 
      label: '教师数量', 
      value: data?.teacherCount || 0, 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      label: '学员数量', 
      value: data?.studentCount || 0, 
      icon: User, 
      color: 'bg-green-500' 
    },
    { 
      label: '课程数量', 
      value: data?.courseCount || 0, 
      icon: BookOpen, 
      color: 'bg-purple-500' 
    },
    { 
      label: '总课时', 
      value: data?.lessonCount || 0, 
      icon: Clock, 
      color: 'bg-orange-500' 
    },
    { 
      label: '今日课程', 
      value: data?.todayLessons || 0, 
      icon: Calendar, 
      color: 'bg-cyan-500' 
    },
  ];

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                <Users className="w-8 h-8 text-blue-500 mb-2" />
                <p className="text-sm font-medium text-blue-700">添加教师</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-100 cursor-pointer hover:bg-green-100 transition-colors">
                <User className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-sm font-medium text-green-700">添加学员</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors">
                <BookOpen className="w-8 h-8 text-purple-500 mb-2" />
                <p className="text-sm font-medium text-purple-700">创建课程</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors">
                <Calendar className="w-8 h-8 text-orange-500 mb-2" />
                <p className="text-sm font-medium text-orange-700">安排课程</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">系统说明</h3>
            <div className="space-y-3 text-gray-600 text-sm">
              <p>• 欢迎使用教培机构教务管理系统</p>
              <p>• 您可以通过左侧菜单管理师资、学员和课程</p>
              <p>• 点击"排班管理"安排教师授课</p>
              <p>• 在"数据报表"查看课时统计信息</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

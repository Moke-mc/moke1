import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { BarChart3, Users, User, BookOpen, Clock } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

const Reports = () => {
  const [stats, setStats] = useState({
    teacherCount: 0,
    studentCount: 0,
    courseCount: 0,
    lessonCount: 0,
  });

  const fetchStats = async () => {
    try {
      const data = await fetchAPI<{ teacherCount: number; studentCount: number; courseCount: number; lessonCount: number; }>('/api/auth/dashboard');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">数据报表</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">教师总数</p>
                <p className="text-3xl font-bold text-gray-800">{stats.teacherCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">学员总数</p>
                <p className="text-3xl font-bold text-gray-800">{stats.studentCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">课程总数</p>
                <p className="text-3xl font-bold text-gray-800">{stats.courseCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">已上课时</p>
                <p className="text-3xl font-bold text-gray-800">{stats.lessonCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              系统概览
            </h3>
            <div className="space-y-4 text-gray-600">
              <p>• 欢迎使用教培机构教务管理系统</p>
              <p>• 此系统提供完整的教务管理功能</p>
              <p>• 支持管理员、教师、家长三种角色</p>
              <p>• 实时记录课时消耗情况</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">使用说明</h3>
            <div className="space-y-3 text-gray-600 text-sm">
              <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
              <p>管理员可以管理教师、学员、课程和排班</p>
              </div>
              <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
              <p>教师可以查看课表和核销课时</p>
              </div>
              <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
              <p>家长可以查看子女的上课情况</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { Calendar, User, BookOpen, Users } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface Schedule {
  id: string;
  teacher_id: string;
  student_id: string;
  course_id: string;
  date: string;
  time: string;
  status: string;
  teacher_name: string;
  student_name: string;
  course_name: string;
}

interface Student {
  id: string;
  parent_id: string;
}

const ParentSchedule = () => {
  const { user } = useStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const fetchSchedules = async () => {
    if (!user) return;
    try {
      // 先获取学员信息
      const students = await fetchAPI<Student[]>('/api/students');
      const myStudent = students.find((s: Student) => s.parent_id === user.id);
      
      if (myStudent) {
        const data = await fetchAPI<Schedule[]>(`/api/schedules?studentId=${myStudent.id}`);
        setSchedules(data);
      }
    } catch (err) {
      console.error('Failed to fetch schedules');
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return '待上课';
    }
  };

  return (
    <Layout role="parent">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">上课安排</h2>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">日期</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">时间</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">教师</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">课程</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800">{schedule.date}</td>
                  <td className="px-6 py-4 text-gray-600">{schedule.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-800">{schedule.teacher_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">{schedule.course_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                      {getStatusText(schedule.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {schedules.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              暂无上课安排
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ParentSchedule;

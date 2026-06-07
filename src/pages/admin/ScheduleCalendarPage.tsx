import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import { Calendar } from 'lucide-react';
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

interface Teacher {
  id: string;
  name: string;
}

const ScheduleCalendarPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  const fetchData = async () => {
    try {
      const [schedulesData, teachersData] = await Promise.all([
        fetchAPI<Schedule[]>('/api/schedules'),
        fetchAPI<Teacher[]>('/api/teachers'),
      ]);
      setSchedules(schedulesData);
      setTeachers(teachersData);
    } catch (err) {
      console.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleClick = (schedule: Schedule) => {
    alert(`课程详情\n\n学员：${schedule.student_name}\n课程：${schedule.course_name}\n时间：${schedule.date} ${schedule.time}\n状态：${
      schedule.status === 'completed' ? '已完成' : 
      schedule.status === 'cancelled' ? '已取消' : '待上课'
    }\n教师：${schedule.teacher_name}`);
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-7 h-7" />
            课程表
          </h2>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-600">筛选教师：</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部教师</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ScheduleCalendar
          schedules={schedules}
          teacherFilter={selectedTeacher}
          onScheduleClick={handleScheduleClick}
        />

        {schedules.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            暂无课程安排，请先在"排班管理"中添加排课
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ScheduleCalendarPage;

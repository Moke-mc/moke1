import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import { useStore } from '../../store';
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

const TeacherScheduleCalendar = () => {
  const { user } = useStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const fetchSchedules = async () => {
    if (!user) return;
    try {
      const data = await fetchAPI<Schedule[]>(`/api/schedules?teacherId=${user.id}`);
      setSchedules(data);
    } catch (err) {
      console.error('Failed to fetch schedules');
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const handleScheduleClick = (schedule: Schedule) => {
    alert(`课程详情\n\n学员：${schedule.student_name}\n课程：${schedule.course_name}\n时间：${schedule.date} ${schedule.time}\n状态：${
      schedule.status === 'completed' ? '已完成' : 
      schedule.status === 'cancelled' ? '已取消' : '待上课'
    }`);
  };

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-7 h-7" />
            我的课表
          </h2>
        </div>

        <ScheduleCalendar
          schedules={schedules}
          onScheduleClick={handleScheduleClick}
        />

        {schedules.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            暂无课程安排
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherScheduleCalendar;

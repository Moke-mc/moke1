import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { Check, Clock, User, BookOpen, Calendar } from 'lucide-react';
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

const TeacherCheckin = () => {
  const { user } = useStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [comment, setComment] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchSchedules = async () => {
    if (!user) return;
    try {
      const data = await fetchAPI<Schedule[]>(`/api/schedules?teacherId=${user.id}`);
      // 只显示待上课的排课
      setSchedules(data.filter((s: Schedule) => s.status === 'scheduled'));
    } catch (err) {
      console.error('Failed to fetch schedules');
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const handleCheckin = async () => {
    if (!selectedSchedule) return;
    try {
      await fetchAPI('/api/lessons/checkin', {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: selectedSchedule.id,
          teacherId: selectedSchedule.teacher_id,
          studentId: selectedSchedule.student_id,
          courseId: selectedSchedule.course_id,
          comment,
        }),
      });
      setShowModal(false);
      setSelectedSchedule(null);
      setComment('');
      fetchSchedules();
    } catch (err) {
      console.error('Failed to checkin');
    }
  };

  const openCheckinModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setComment('');
    setShowModal(true);
  };

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">课时核销</h2>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">日期</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">时间</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">学员</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">课程</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800">{schedule.date}</td>
                  <td className="px-6 py-4 text-gray-600">{schedule.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-500" />
                      <span className="text-gray-800">{schedule.student_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">{schedule.course_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openCheckinModal(schedule)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      核销课时
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {schedules.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              暂无待核销的课时
            </div>
          )}
        </div>
      </div>

      {showModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">核销课时</h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{selectedSchedule.date} {selectedSchedule.time}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>学员：{selectedSchedule.student_name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>课程：{selectedSchedule.course_name}</span>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">课堂评语</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="请输入课堂评语..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCheckin}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认核销
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TeacherCheckin;

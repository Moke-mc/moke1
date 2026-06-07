import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
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

interface Student {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
}

const TIME_SLOTS = [
  { value: '09:00', label: '09:00 - 10:30' },
  { value: '10:30', label: '10:30 - 12:00' },
  { value: '14:00', label: '14:00 - 15:30' },
  { value: '15:30', label: '15:30 - 17:00' },
  { value: '17:00', label: '17:00 - 18:30' },
  { value: '18:30', label: '18:30 - 20:00' },
];

const Schedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    teacherId: '',
    studentId: '',
    courseId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
  });

  const fetchData = async () => {
    try {
      const [schedulesData, teachersData, studentsData, coursesData] = await Promise.all([
        fetchAPI<Schedule[]>('/api/schedules'),
        fetchAPI<Teacher[]>('/api/teachers'),
        fetchAPI<Student[]>('/api/students'),
        fetchAPI<Course[]>('/api/courses'),
      ]);
      setSchedules(schedulesData);
      setTeachers(teachersData);
      setStudents(studentsData);
      setCourses(coursesData);
    } catch (err) {
      console.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await fetchAPI(`/api/schedules/${editingSchedule.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            teacherId: formData.teacherId,
            studentId: formData.studentId,
            courseId: formData.courseId,
            date: formData.date,
            time: formData.time,
            status: 'scheduled',
          }),
        });
      } else {
        await fetchAPI('/api/schedules', {
          method: 'POST',
          body: JSON.stringify({
            teacherId: formData.teacherId,
            studentId: formData.studentId,
            courseId: formData.courseId,
            date: formData.date,
            time: formData.time,
          }),
        });
      }
      setShowModal(false);
      setEditingSchedule(null);
      setFormData({
        teacherId: '',
        studentId: '',
        courseId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to save schedule');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      teacherId: schedule.teacher_id,
      studentId: schedule.student_id,
      courseId: schedule.course_id,
      date: schedule.date,
      time: schedule.time,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个排班吗？')) {
      try {
        await fetchAPI(`/api/schedules/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        console.error('Failed to delete schedule');
      }
    }
  };

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

  const getTimeSlotLabel = (time: string) => {
    const slot = TIME_SLOTS.find(s => s.value === time);
    return slot ? slot.label : time;
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">排班管理</h2>
          <button
            onClick={() => {
              setEditingSchedule(null);
              setFormData({
                teacherId: teachers[0]?.id || '',
                studentId: students[0]?.id || '',
                courseId: courses[0]?.id || '',
                date: new Date().toISOString().split('T')[0],
                time: '09:00',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加排班
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">日期</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">时间段</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">教师</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">学员</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">课程</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800">{schedule.date}</td>
                  <td className="px-6 py-4 text-orange-600 font-medium">
                    {getTimeSlotLabel(schedule.time)}
                  </td>
                  <td className="px-6 py-4 text-gray-800">{schedule.teacher_name}</td>
                  <td className="px-6 py-4 text-gray-800">{schedule.student_name}</td>
                  <td className="px-6 py-4 text-gray-600">{schedule.course_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                      {getStatusText(schedule.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {schedules.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              暂无排班数据
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingSchedule ? '编辑排班' : '添加排班'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择教师</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">请选择教师</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择学员</label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">请选择学员</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择课程</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">请选择课程</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时间段</label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">请选择时间段</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Schedules;

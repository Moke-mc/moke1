import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { BookOpen, Users, Plus, CheckCircle } from 'lucide-react';
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

interface Course {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Enrollment {
  id: string;
  student_id: string;
  student_name: string;
  course_id: string;
  course_name: string;
  teacher_id: string;
  teacher_name: string;
  date: string;
  time: string;
  message: string;
  status: string;
  created_at: string;
}

const TIME_SLOTS = [
  '09:00-10:30',
  '10:30-12:00',
  '14:00-15:30',
  '15:30-17:00',
  '17:00-18:30',
  '18:30-20:00',
];

const ParentSchedule = () => {
  const { user } = useStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [myStudentId, setMyStudentId] = useState('');
  const [formData, setFormData] = useState({
    courseId: '',
    teacherId: '',
    date: new Date().toISOString().split('T')[0],
    time: TIME_SLOTS[0],
    message: '',
  });

  const fetchSchedules = async () => {
    if (!user) return;
    try {
      // 先获取学员信息
      const students = await fetchAPI<Student[]>('/api/students');
      const myStudent = students.find((s: Student) => s.parent_id === user.id);

      if (myStudent) {
        setMyStudentId(myStudent.id);
        const data = await fetchAPI<Schedule[]>(`/api/schedules?studentId=${myStudent.id}`);
        setSchedules(data);
      }
    } catch (err) {
      console.error('Failed to fetch schedules');
    }
  };

  const fetchEnrollments = async () => {
    if (!user) return;
    try {
      const data = await fetchAPI<Enrollment[]>(`/api/enrollments?parentId=${user.id}`);
      setEnrollments(data);
    } catch (err) {
      console.error('Failed to fetch enrollments');
    }
  };

  const fetchOptions = async () => {
    try {
      const [coursesData, teachersData] = await Promise.all([
        fetchAPI<Course[]>('/api/courses'),
        fetchAPI<Teacher[]>('/api/teachers'),
      ]);
      setCourses(coursesData);
      setTeachers(teachersData);
    } catch (err) {
      console.error('Failed to fetch options');
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchEnrollments();
    fetchOptions();
  }, [user]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myStudentId) {
      showToast('未找到学员信息，无法提交申请');
      return;
    }
    setSubmitting(true);
    try {
      await fetchAPI('/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          studentId: myStudentId,
          courseId: formData.courseId,
          teacherId: formData.teacherId,
          date: formData.date,
          time: formData.time,
          message: formData.message,
        }),
      });
      setShowModal(false);
      setFormData({
        courseId: '',
        teacherId: '',
        date: new Date().toISOString().split('T')[0],
        time: TIME_SLOTS[0],
        message: '',
      });
      showToast('申请已提交，等待审核');
      fetchEnrollments();
    } catch (err) {
      console.error('Failed to submit enrollment');
      showToast('提交失败，请重试');
    } finally {
      setSubmitting(false);
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

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getEnrollmentStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已拒绝';
      default:
        return '待审核';
    }
  };

  return (
    <Layout role="parent">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">上课安排</h2>
          <button
            onClick={() => {
              setFormData({
                courseId: courses[0]?.id || '',
                teacherId: teachers[0]?.id || '',
                date: new Date().toISOString().split('T')[0],
                time: TIME_SLOTS[0],
                message: '',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            申请上课
          </button>
        </div>

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

        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">我的申请</h3>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">课程</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">教师</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">日期</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">时间</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-800">{enrollment.course_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-800">{enrollment.teacher_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-800">{enrollment.date}</td>
                    <td className="px-6 py-4 text-gray-600">{enrollment.time}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEnrollmentStatusColor(enrollment.status)}`}>
                        {getEnrollmentStatusText(enrollment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {enrollments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                暂无申请记录
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">申请上课</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择课程</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择教师</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时间段</label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">留言/备注</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="请输入留言或备注（选填）"
                />
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
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-white border border-green-200 shadow-lg rounded-lg px-4 py-3 flex items-center gap-2 z-50">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-gray-800">{toast}</span>
        </div>
      )}
    </Layout>
  );
};

export default ParentSchedule;

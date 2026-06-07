import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Clock, BookOpen, User, Users } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface LessonRecord {
  id: string;
  schedule_id: string;
  teacher_id: string;
  student_id: string;
  course_id: string;
  date: string;
  comment: string;
  teacher_name: string;
  student_name: string;
  course_name: string;
}

const Lessons = () => {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);

  const fetchLessons = async () => {
    try {
      const data = await fetchAPI<LessonRecord[]>('/api/lessons');
      setLessons(data);
    } catch (err) {
      console.error('Failed to fetch lessons');
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">课时记录</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">日期</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">教师</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">学员</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">课程</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">课堂评语</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800">{lesson.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-800">{lesson.teacher_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-500" />
                      <span className="text-gray-800">{lesson.student_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">{lesson.course_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={lesson.comment}>
                    {lesson.comment || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lessons.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              暂无课时记录
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Lessons;

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { BookOpen, User, Users, Calendar, Clock } from 'lucide-react';
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

interface Student {
  id: string;
  parent_id: string;
}

const ParentComments = () => {
  const { user } = useStore();
  const [comments, setComments] = useState<LessonRecord[]>([]);

  const fetchComments = async () => {
    if (!user) return;
    try {
      // 先获取学员信息
      const students = await fetchAPI<Student[]>('/api/students');
      const myStudent = students.find((s: Student) => s.parent_id === user.id);
      
      if (myStudent) {
        const data = await fetchAPI<LessonRecord[]>(`/api/lessons?studentId=${myStudent.id}`);
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments');
    }
  };

  useEffect(() => {
    fetchComments();
  }, [user]);

  return (
    <Layout role="parent">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">历史评语</h2>

        <div className="space-y-4">
          {comments.map((record) => (
            <div key={record.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{record.teacher_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {record.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {record.course_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {record.comment ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{record.comment}</p>
                </div>
              ) : (
                <p className="text-gray-500">暂无评语</p>
              )}
            </div>
          ))}
        </div>
        {comments.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            暂无历史评语
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ParentComments;

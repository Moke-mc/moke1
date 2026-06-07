import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { Clock, User, BookOpen } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface Student {
  id: string;
  name: string;
  parent_id: string;
  total_lessons: number;
  used_lessons: number;
  parent_name: string;
}

const ParentLessons = () => {
  const { user } = useStore();
  const [student, setStudent] = useState<Student | null>(null);

  const fetchStudent = async () => {
    if (!user) return;
    try {
      const data = await fetchAPI<Student[]>('/api/students');
      const myStudent = data.find((s: Student) => s.parent_id === user.id);
      setStudent(myStudent || null);
    } catch (err) {
      console.error('Failed to fetch student');
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [user]);

  return (
    <Layout role="parent">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">剩余课时</h2>

        {student ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">总课时</p>
                  <p className="text-3xl font-bold text-gray-800">{student.total_lessons}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">已上课时</p>
                  <p className="text-3xl font-bold text-gray-800">{student.used_lessons}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  student.total_lessons - student.used_lessons < 5 
                    ? 'bg-red-100' 
                    : 'bg-purple-100'
                }`}>
                  <Clock className={`w-8 h-8 ${
                    student.total_lessons - student.used_lessons < 5 
                      ? 'text-red-600' 
                      : 'text-purple-600'
                  }`} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">剩余课时</p>
                  <p className={`text-3xl font-bold ${
                    student.total_lessons - student.used_lessons < 5 
                      ? 'text-red-600' 
                      : 'text-purple-600'
                  }`}>
                    {student.total_lessons - student.used_lessons}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            暂无学员信息
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ParentLessons;

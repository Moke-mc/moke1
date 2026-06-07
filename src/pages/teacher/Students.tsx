import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { User, Calendar } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface Schedule {
  id: string;
  student_id: string;
  student_name: string;
}

const TeacherStudents = () => {
  const { user } = useStore();
  const [students, setStudents] = useState<any[]>([]);

  const fetchStudents = async () => {
    if (!user) return;
    try {
      const data = await fetchAPI<any[]>(`/api/schedules?teacherId=${user.id}`);
      // 去重获取学员列表
      const uniqueStudents = Array.from(
        new Map(data.map((s: any) => [s.student_id, s])).values()
      );
      setStudents(uniqueStudents);
    } catch (err) {
      console.error('Failed to fetch students');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user]);

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">授课学员</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div key={student.student_id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{student.student_name}</h3>
                  <p className="text-sm text-gray-500">我的学员</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {students.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            暂无授课学员
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherStudents;

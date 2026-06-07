import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { User, Users } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface Student {
  id: string;
  name: string;
  phone: string;
  parent_id: string;
  total_lessons: number;
  used_lessons: number;
  parent_name: string;
}

const ParentProfile = () => {
  const { user } = useStore();
  const [student, setStudent] = useState<Student | null>(null);

  const fetchStudent = async () => {
    if (!user) return;
    try {
      const data = await fetchAPI<Student[]>('/api/students');
      // 找到对应家长的学员
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
        <h2 className="text-2xl font-bold text-gray-800">子女档案</h2>

        {student ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{student.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">联系电话</p>
                    <p className="text-gray-800">{student.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">家长姓名</p>
                    <p className="text-gray-800">{student.parent_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">总课时</p>
                    <p className="text-gray-800">{student.total_lessons} 课时</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">已上课时</p>
                    <p className="text-gray-800">{student.used_lessons} 课时</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">剩余课时</p>
                    <p className={`text-xl font-bold ${
                      student.total_lessons - student.used_lessons < 5 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {student.total_lessons - student.used_lessons} 课时
                    </p>
                  </div>
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

export default ParentProfile;

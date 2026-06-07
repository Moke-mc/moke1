import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Plus, Edit, Trash2, User, BookOpen } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface Student {
  id: string;
  name: string;
  phone: string;
  parent_id: string;
  total_lessons: number;
  used_lessons: number;
  parent_name: string;
  subject?: string;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    totalLessons: 0,
    subject: '',
  });

  const fetchStudents = async () => {
    try {
      const data = await fetchAPI<Student[]>('/api/students');
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await fetchAPI(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            totalLessons: formData.totalLessons,
            subject: formData.subject,
          }),
        });
      } else {
        await fetchAPI('/api/students', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      setEditingStudent(null);
      setFormData({ name: '', phone: '', parentName: '', parentPhone: '', totalLessons: 0, subject: '' });
      fetchStudents();
    } catch (err) {
      console.error('Failed to save student');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      phone: student.phone,
      parentName: student.parent_name,
      parentPhone: '',
      totalLessons: student.total_lessons,
      subject: student.subject || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这位学员吗？')) {
      try {
        await fetchAPI(`/api/students/${id}`, { method: 'DELETE' });
        fetchStudents();
      } catch (err) {
        console.error('Failed to delete student');
      }
    }
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">学员管理</h2>
          <button
            onClick={() => {
              setEditingStudent(null);
              setFormData({ name: '', phone: '', parentName: '', parentPhone: '', totalLessons: 0, subject: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加学员
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">学员姓名</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">电话</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">所学科目</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">家长姓名</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">总课时</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">已用课时</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">剩余课时</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-medium text-gray-800">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{student.phone}</td>
                  <td className="px-6 py-4">
                    {student.subject ? (
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-800">{student.subject}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">未设置</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{student.parent_name}</td>
                  <td className="px-6 py-4 text-gray-600">{student.total_lessons}</td>
                  <td className="px-6 py-4 text-gray-600">{student.used_lessons}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      student.total_lessons - student.used_lessons < 5 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {student.total_lessons - student.used_lessons}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
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
          {students.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              暂无学员数据
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingStudent ? '编辑学员' : '添加学员'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学员姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学员电话</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所学科目</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如：数学、英语、物理等"
                />
              </div>
              {!editingStudent && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">家长姓名</label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">家长电话</label>
                    <input
                      type="text"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">总课时</label>
                <input
                  type="number"
                  value={formData.totalLessons}
                  onChange={(e) => setFormData({ ...formData, totalLessons: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  min="0"
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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

export default Students;

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface Teacher {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
}

const Teachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
  });

  const fetchTeachers = async () => {
    try {
      const data = await fetchAPI<Teacher[]>('/api/teachers');
      setTeachers(data);
    } catch (err) {
      console.error('Failed to fetch teachers');
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await fetchAPI(`/api/teachers/${editingTeacher.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await fetchAPI('/api/teachers', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      setEditingTeacher(null);
      setFormData({ name: '', phone: '', email: '', subject: '' });
      fetchTeachers();
    } catch (err) {
      console.error('Failed to save teacher');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData(teacher);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这位教师吗？')) {
      try {
        await fetchAPI(`/api/teachers/${id}`, { method: 'DELETE' });
        fetchTeachers();
      } catch (err) {
        console.error('Failed to delete teacher');
      }
    }
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">师资管理</h2>
          <button
            onClick={() => {
              setEditingTeacher(null);
              setFormData({ name: '', phone: '', email: '', subject: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加教师
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">教师姓名</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">电话</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">邮箱</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">科目</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-800">{teacher.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{teacher.phone}</td>
                  <td className="px-6 py-4 text-gray-600">{teacher.email || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{teacher.subject}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
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
          {teachers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              暂无教师数据
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingTeacher ? '编辑教师' : '添加教师'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

export default Teachers;

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface Course {
  id: string;
  name: string;
  description: string;
  duration: number;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
  });

  const fetchCourses = async () => {
    try {
      const data = await fetchAPI<Course[]>('/api/courses');
      setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await fetchAPI(`/api/courses/${editingCourse.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await fetchAPI('/api/courses', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      setEditingCourse(null);
      setFormData({ name: '', description: '', duration: 60 });
      fetchCourses();
    } catch (err) {
      console.error('Failed to save course');
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData(course);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这门课程吗？')) {
      try {
        await fetchAPI(`/api/courses/${id}`, { method: 'DELETE' });
        fetchCourses();
      } catch (err) {
        console.error('Failed to delete course');
      }
    }
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">课程管理</h2>
          <button
            onClick={() => {
              setEditingCourse(null);
              setFormData({ name: '', description: '', duration: 60 });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加课程
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{course.name}</h3>
                    <p className="text-sm text-gray-500">{course.duration}分钟/课时</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {course.description && (
                <p className="mt-4 text-gray-600 text-sm">{course.description}</p>
              )}
            </div>
          ))}
        </div>
        {courses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            暂无课程数据
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingCourse ? '编辑课程' : '添加课程'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课时时长(分钟)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  min="1"
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
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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

export default Courses;

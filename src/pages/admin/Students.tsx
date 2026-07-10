import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Plus, Edit, Trash2, User, BookOpen, FileText, Camera, Trophy, X } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface CompetitionExperience {
  name: string;
  date: string;
  result: string;
  description: string;
}

interface Student {
  id: string;
  name: string;
  phone: string;
  parent_id: string;
  total_lessons: number;
  used_lessons: number;
  parent_name: string;
  parent_username?: string;
  subject?: string;
  photo?: string;
  gender?: string;
  birth_date?: string;
  school?: string;
  grade?: string;
  address?: string;
  competition_experiences?: string;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    totalLessons: 0,
    subject: '',
    parentUsername: '',
    parentPassword: '',
  });
  const [profileData, setProfileData] = useState({
    photo: '',
    gender: '',
    birthDate: '',
    school: '',
    grade: '',
    address: '',
    competitionExperiences: [] as CompetitionExperience[],
  });
  const [newExp, setNewExp] = useState<CompetitionExperience>({ name: '', date: '', result: '', description: '' });

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
        const { parentPassword, ...rest } = formData;
        await fetchAPI(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          body: JSON.stringify(rest),
        });
      } else {
        await fetchAPI('/api/students', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        alert(`学员创建成功！\n家长登录账号：${formData.parentUsername}\n请妥善保管账号信息。`);
      }
      setShowModal(false);
      setEditingStudent(null);
      setFormData({ name: '', phone: '', parentName: '', parentPhone: '', totalLessons: 0, subject: '', parentUsername: '', parentPassword: '' });
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
      parentUsername: student.parent_username || '',
      parentPassword: '',
    });
    setShowModal(true);
  };

  const handleProfile = (student: Student) => {
    setProfileStudent(student);
    let experiences: CompetitionExperience[] = [];
    try {
      experiences = student.competition_experiences ? JSON.parse(student.competition_experiences) : [];
    } catch (err) {
      experiences = [];
    }
    setProfileData({
      photo: student.photo || '',
      gender: student.gender || '',
      birthDate: student.birth_date || '',
      school: student.school || '',
      grade: student.grade || '',
      address: student.address || '',
      competitionExperiences: experiences,
    });
    setNewExp({ name: '', date: '', result: '', description: '' });
    setShowProfileModal(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('照片大小不能超过2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfileData({ ...profileData, photo: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const addExperience = () => {
    if (!newExp.name.trim()) return;
    setProfileData({
      ...profileData,
      competitionExperiences: [...profileData.competitionExperiences, { ...newExp }],
    });
    setNewExp({ name: '', date: '', result: '', description: '' });
  };

  const removeExperience = (index: number) => {
    setProfileData({
      ...profileData,
      competitionExperiences: profileData.competitionExperiences.filter((_, i) => i !== index),
    });
  };

  const handleProfileSave = async () => {
    if (!profileStudent) return;
    try {
      await fetchAPI(`/api/students/${profileStudent.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profileStudent.name,
          phone: profileStudent.phone,
          totalLessons: profileStudent.total_lessons,
          subject: profileStudent.subject || '',
          parentUsername: profileStudent.parent_username || '',
          photo: profileData.photo,
          gender: profileData.gender,
          birthDate: profileData.birthDate,
          school: profileData.school,
          grade: profileData.grade,
          address: profileData.address,
          competitionExperiences: profileData.competitionExperiences,
        }),
      });
      setShowProfileModal(false);
      fetchStudents();
    } catch (err) {
      console.error('Failed to update profile');
    }
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
              setFormData({ name: '', phone: '', parentName: '', parentPhone: '', totalLessons: 0, subject: '', parentUsername: '', parentPassword: '' });
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
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">家长账号</th>
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
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                      )}
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
                  <td className="px-6 py-4 text-gray-600">{student.parent_username || '-'}</td>
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
                        onClick={() => handleProfile(student)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="学生档案"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
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

      {/* 添加/编辑学员弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">家长登录用户名</label>
                <input
                  type="text"
                  value={formData.parentUsername}
                  onChange={(e) => setFormData({ ...formData, parentUsername: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              {!editingStudent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">家长登录密码</label>
                  <input
                    type="password"
                    value={formData.parentPassword}
                    onChange={(e) => setFormData({ ...formData, parentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
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

      {/* 学生档案弹窗 */}
      {showProfileModal && profileStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">学生档案 - {profileStudent.name}</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 照片 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Camera className="w-4 h-4" /> 学生照片
                </label>
                <div className="flex items-center gap-4">
                  {profileData.photo ? (
                    <img src={profileData.photo} alt="学生照片" className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    {profileData.photo && (
                      <button
                        onClick={() => setProfileData({ ...profileData, photo: '' })}
                        className="ml-2 text-sm text-red-500 hover:text-red-700"
                      >
                        移除照片
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 个人信息 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                  <FileText className="w-4 h-4" /> 个人信息
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">性别</label>
                    <select
                      value={profileData.gender}
                      onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">请选择</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">出生日期</label>
                    <input
                      type="date"
                      value={profileData.birthDate}
                      onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">就读学校</label>
                    <input
                      type="text"
                      value={profileData.school}
                      onChange={(e) => setProfileData({ ...profileData, school: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                      placeholder="如：XX小学"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">年级</label>
                    <input
                      type="text"
                      value={profileData.grade}
                      onChange={(e) => setProfileData({ ...profileData, grade: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                      placeholder="如：三年级"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">家庭住址</label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                      placeholder="详细地址"
                    />
                  </div>
                </div>
              </div>

              {/* 比赛经历 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                  <Trophy className="w-4 h-4" /> 比赛经历
                </h4>
                {/* 已有经历列表 */}
                <div className="space-y-2 mb-3">
                  {profileData.competitionExperiences.map((exp, index) => (
                    <div key={index} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 text-sm">{exp.name}</span>
                          {exp.date && <span className="text-xs text-gray-500">{exp.date}</span>}
                        </div>
                        {exp.result && <span className="text-sm text-green-600">{exp.result}</span>}
                        {exp.description && <p className="text-xs text-gray-500 mt-1">{exp.description}</p>}
                      </div>
                      <button
                        onClick={() => removeExperience(index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* 添加新经历 */}
                <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newExp.name}
                      onChange={(e) => setNewExp({ ...newExp, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                      placeholder="比赛名称"
                    />
                    <input
                      type="date"
                      value={newExp.date}
                      onChange={(e) => setNewExp({ ...newExp, date: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <input
                    type="text"
                    value={newExp.result}
                    onChange={(e) => setNewExp({ ...newExp, result: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    placeholder="获奖情况（如：一等奖）"
                  />
                  <input
                    type="text"
                    value={newExp.description}
                    onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    placeholder="比赛描述"
                  />
                  <button
                    onClick={addExperience}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> 添加比赛经历
                  </button>
                </div>
              </div>

              {/* 保存按钮 */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleProfileSave}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  保存档案
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Students;

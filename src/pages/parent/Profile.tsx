import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { User, Camera, FileText, Trophy, Edit, X, Plus, Save, BookOpen } from 'lucide-react';
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
  subject?: string;
  photo?: string;
  gender?: string;
  birth_date?: string;
  school?: string;
  grade?: string;
  address?: string;
  competition_experiences?: string;
}

const ParentProfile = () => {
  const { user } = useStore();
  const [student, setStudent] = useState<Student | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    photo: '',
    gender: '',
    birthDate: '',
    school: '',
    grade: '',
    address: '',
    competitionExperiences: [] as CompetitionExperience[],
  });
  const [newExp, setNewExp] = useState<CompetitionExperience>({ name: '', date: '', result: '', description: '' });

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

  const startEdit = () => {
    if (!student) return;
    let experiences: CompetitionExperience[] = [];
    try {
      experiences = student.competition_experiences ? JSON.parse(student.competition_experiences) : [];
    } catch (err) {
      experiences = [];
    }
    setEditData({
      photo: student.photo || '',
      gender: student.gender || '',
      birthDate: student.birth_date || '',
      school: student.school || '',
      grade: student.grade || '',
      address: student.address || '',
      competitionExperiences: experiences,
    });
    setNewExp({ name: '', date: '', result: '', description: '' });
    setEditing(true);
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
      setEditData({ ...editData, photo: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const addExperience = () => {
    if (!newExp.name.trim()) return;
    setEditData({
      ...editData,
      competitionExperiences: [...editData.competitionExperiences, { ...newExp }],
    });
    setNewExp({ name: '', date: '', result: '', description: '' });
  };

  const removeExperience = (index: number) => {
    setEditData({
      ...editData,
      competitionExperiences: editData.competitionExperiences.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    if (!student) return;
    try {
      await fetchAPI(`/api/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: student.name,
          phone: student.phone,
          totalLessons: student.total_lessons,
          subject: student.subject || '',
          parentUsername: '',
          photo: editData.photo,
          gender: editData.gender,
          birthDate: editData.birthDate,
          school: editData.school,
          grade: editData.grade,
          address: editData.address,
          competitionExperiences: editData.competitionExperiences,
        }),
      });
      setEditing(false);
      fetchStudent();
    } catch (err) {
      console.error('Failed to update profile');
      alert('保存失败，请重试');
    }
  };

  const parseExperiences = (str?: string): CompetitionExperience[] => {
    try {
      return str ? JSON.parse(str) : [];
    } catch {
      return [];
    }
  };

  return (
    <Layout role="parent">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">子女档案</h2>
          {student && !editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              编辑档案
            </button>
          )}
        </div>

        {student ? (
          !editing ? (
            /* 查看模式 */
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-start gap-6 mb-6">
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-24 h-24 bg-green-100 rounded-xl flex items-center justify-center">
                    <User className="w-12 h-12 text-green-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{student.name}</h3>
                  {student.subject && (
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">{student.subject}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">家长：{student.parent_name}</p>
                </div>
              </div>

              {/* 个人信息 */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                  <FileText className="w-4 h-4" /> 个人信息
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-gray-500">性别</p>
                    <p className="text-gray-800">{student.gender || '未填写'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">出生日期</p>
                    <p className="text-gray-800">{student.birth_date || '未填写'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">就读学校</p>
                    <p className="text-gray-800">{student.school || '未填写'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">年级</p>
                    <p className="text-gray-800">{student.grade || '未填写'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">联系电话</p>
                    <p className="text-gray-800">{student.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">家庭住址</p>
                    <p className="text-gray-800">{student.address || '未填写'}</p>
                  </div>
                </div>
              </div>

              {/* 课时信息 */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">课时信息</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500">总课时</p>
                    <p className="text-2xl font-bold text-blue-600">{student.total_lessons}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500">已上课时</p>
                    <p className="text-2xl font-bold text-orange-600">{student.used_lessons}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500">剩余课时</p>
                    <p className={`text-2xl font-bold ${
                      student.total_lessons - student.used_lessons < 5 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {student.total_lessons - student.used_lessons}
                    </p>
                  </div>
                </div>
              </div>

              {/* 比赛经历 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                  <Trophy className="w-4 h-4" /> 比赛经历
                </h4>
                {parseExperiences(student.competition_experiences).length > 0 ? (
                  <div className="space-y-3">
                    {parseExperiences(student.competition_experiences).map((exp, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800">{exp.name}</span>
                          {exp.date && <span className="text-xs text-gray-500">{exp.date}</span>}
                        </div>
                        {exp.result && (
                          <span className="inline-block bg-green-100 text-green-700 text-sm px-2 py-1 rounded mb-1">
                            {exp.result}
                          </span>
                        )}
                        {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">暂无比赛经历</p>
                )}
              </div>
            </div>
          ) : (
            /* 编辑模式 */
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">编辑档案</h3>
                <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
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
                    {editData.photo ? (
                      <img src={editData.photo} alt="学生照片" className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200" />
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
                        className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {editData.photo && (
                        <button
                          onClick={() => setEditData({ ...editData, photo: '' })}
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
                        value={editData.gender}
                        onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
                        value={editData.birthDate}
                        onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">就读学校</label>
                      <input
                        type="text"
                        value={editData.school}
                        onChange={(e) => setEditData({ ...editData, school: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="如：XX小学"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">年级</label>
                      <input
                        type="text"
                        value={editData.grade}
                        onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="如：三年级"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">家庭住址</label>
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
                  <div className="space-y-2 mb-3">
                    {editData.competitionExperiences.map((exp, index) => (
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
                  <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newExp.name}
                        onChange={(e) => setNewExp({ ...newExp, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="比赛名称"
                      />
                      <input
                        type="date"
                        value={newExp.date}
                        onChange={(e) => setNewExp({ ...newExp, date: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={newExp.result}
                      onChange={(e) => setNewExp({ ...newExp, result: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="获奖情况（如：一等奖）"
                    />
                    <input
                      type="text"
                      value={newExp.description}
                      onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
                    onClick={() => setEditing(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Save className="w-4 h-4" /> 保存档案
                  </button>
                </div>
              </div>
            </div>
          )
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

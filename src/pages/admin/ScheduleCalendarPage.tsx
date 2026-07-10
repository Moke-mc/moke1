import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import { Calendar, Clock, Plus, Edit, Trash2, Settings, X } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface Schedule {
  id: string;
  teacher_id: string;
  student_id: string;
  course_id: string;
  category_id?: string;
  date: string;
  time: string;
  status: string;
  teacher_name: string;
  student_name: string;
  course_name: string;
  category_name?: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  category_id?: string | null;
}

const ScheduleCalendarPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  // 'all' = 总课表, category.id = 分课表
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlotForm, setTimeSlotForm] = useState({
    startTime: '09:00',
    endTime: '10:30',
    sortOrder: 1,
  });

  const fetchData = async () => {
    try {
      const [schedulesData, teachersData, categoriesData] = await Promise.all([
        fetchAPI<Schedule[]>('/api/schedules'),
        fetchAPI<Teacher[]>('/api/teachers'),
        fetchAPI<Category[]>('/api/categories'),
      ]);
      setSchedules(schedulesData);
      setTeachers(teachersData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch data');
    }
  };

  // 根据当前选中的标签获取对应的时间段
  const fetchTimeSlots = async (tab: string) => {
    try {
      let url = '/api/time-slots';
      if (tab !== 'all') {
        url = `/api/time-slots?categoryId=${tab}`;
      }
      const data = await fetchAPI<TimeSlot[]>(url);
      setTimeSlots(data);
    } catch (err) {
      console.error('Failed to fetch time slots');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 切换标签时重新获取时间段
  useEffect(() => {
    fetchTimeSlots(activeTab);
  }, [activeTab]);

  const handleScheduleClick = (schedule: Schedule) => {
    alert(`课程详情\n\n学员：${schedule.student_name}\n课程：${schedule.course_name}\n分类：${schedule.category_name || '未分类'}\n时间：${schedule.date} ${schedule.time}\n状态：${
      schedule.status === 'completed' ? '已完成' :
      schedule.status === 'cancelled' ? '已取消' : '待上课'
    }\n教师：${schedule.teacher_name}`);
  };

  // 时间线管理
  const handleTimeSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 当前标签对应的 categoryId（总课表为 null）
      const categoryId = activeTab === 'all' ? null : activeTab;
      if (editingTimeSlot) {
        await fetchAPI(`/api/time-slots/${editingTimeSlot.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            startTime: timeSlotForm.startTime,
            endTime: timeSlotForm.endTime,
            sortOrder: timeSlotForm.sortOrder,
            categoryId,
          }),
        });
      } else {
        await fetchAPI('/api/time-slots', {
          method: 'POST',
          body: JSON.stringify({
            startTime: timeSlotForm.startTime,
            endTime: timeSlotForm.endTime,
            sortOrder: timeSlotForm.sortOrder,
            categoryId,
          }),
        });
      }
      setShowTimeSlotModal(false);
      setEditingTimeSlot(null);
      setTimeSlotForm({ startTime: '09:00', endTime: '10:30', sortOrder: 1 });
      fetchTimeSlots(activeTab);
    } catch (err) {
      console.error('Failed to save time slot');
    }
  };

  const handleEditTimeSlot = (slot: TimeSlot) => {
    setEditingTimeSlot(slot);
    setTimeSlotForm({
      startTime: slot.start_time,
      endTime: slot.end_time,
      sortOrder: slot.sort_order,
    });
    setShowTimeSlotModal(true);
  };

  const handleDeleteTimeSlot = async (id: string) => {
    if (confirm('确定要删除这个时间段吗？')) {
      try {
        await fetchAPI(`/api/time-slots/${id}`, { method: 'DELETE' });
        fetchTimeSlots(activeTab);
      } catch (err) {
        console.error('Failed to delete time slot');
      }
    }
  };

  // 当前选中的分类ID（用于过滤课表）
  const currentCategoryFilter = activeTab === 'all' ? undefined : activeTab;

  // 当前课表标题
  const getCurrentTitle = () => {
    if (activeTab === 'all') return '总课表';
    const cat = categories.find(c => c.id === activeTab);
    return cat ? `${cat.name}课表` : '课程表';
  };

  // 当前时间段标题后缀
  const getTimeSlotLabel = () => {
    if (activeTab === 'all') return '总课表时间段';
    const cat = categories.find(c => c.id === activeTab);
    return cat ? `${cat.name}独立时间段` : '时间段';
  };

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-7 h-7" />
            {getCurrentTitle()}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingTimeSlot(null);
                setTimeSlotForm({ startTime: '09:00', endTime: '10:30', sortOrder: timeSlots.length + 1 });
                setShowTimeSlotModal(true);
              }}
              className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Settings className="w-5 h-5" />
              时间线管理
            </button>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部教师</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 分类标签页 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            总课表
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-2 rounded-lg font-medium transition-colors ${
                activeTab === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 课表 */}
        <ScheduleCalendar
          schedules={schedules}
          timeSlots={timeSlots}
          teacherFilter={selectedTeacher}
          categoryFilter={currentCategoryFilter}
          onScheduleClick={handleScheduleClick}
        />

        {/* 当前课表的时间段设置 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-600" />
              {getTimeSlotLabel()}
            </h3>
            <button
              onClick={() => {
                setEditingTimeSlot(null);
                setTimeSlotForm({ startTime: '09:00', endTime: '10:30', sortOrder: timeSlots.length + 1 });
                setShowTimeSlotModal(true);
              }}
              className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              添加时间段
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {timeSlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {slot.start_time} - {slot.end_time}
                  </div>
                  <div className="text-xs text-gray-500">排序: {slot.sort_order}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditTimeSlot(slot)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTimeSlot(slot.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {timeSlots.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-4">
                暂无时间段，请点击"添加时间段"创建
              </div>
            )}
          </div>
        </div>

        {schedules.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            暂无课程安排，请先在"排班管理"中添加排课
          </div>
        )}
      </div>

      {/* 时间段编辑模态框 */}
      {showTimeSlotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingTimeSlot ? '编辑时间段' : '添加时间段'}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  （{getCurrentTitle()}）
                </span>
              </h3>
              <button
                onClick={() => setShowTimeSlotModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleTimeSlotSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input
                    type="time"
                    value={timeSlotForm.startTime}
                    onChange={(e) => setTimeSlotForm({ ...timeSlotForm, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input
                    type="time"
                    value={timeSlotForm.endTime}
                    onChange={(e) => setTimeSlotForm({ ...timeSlotForm, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序（数字越小越靠前）</label>
                <input
                  type="number"
                  value={timeSlotForm.sortOrder}
                  onChange={(e) => setTimeSlotForm({ ...timeSlotForm, sortOrder: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                  min="1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTimeSlotModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
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

export default ScheduleCalendarPage;

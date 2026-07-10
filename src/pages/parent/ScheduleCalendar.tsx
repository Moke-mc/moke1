import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { Calendar, Clock, User, BookOpen, ChevronLeft, ChevronRight, Plus, X, CheckCircle } from 'lucide-react';
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

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  category_id?: string | null;
}

interface Course {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Student {
  id: string;
  parent_id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

const ParentScheduleCalendar = () => {
  const { user } = useStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [myStudentId, setMyStudentId] = useState<string>('');
  const [myStudentName, setMyStudentName] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    date: '',
    startTime: '',
    endTime: '',
  });

  // 周视图状态
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    weekDays.push(date);
  }
  const weekDaysNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // 获取数据
  const fetchData = async () => {
    try {
      const [studentsData, coursesData, teachersData, categoriesData] = await Promise.all([
        fetchAPI<Student[]>('/api/students'),
        fetchAPI<Course[]>('/api/courses'),
        fetchAPI<Teacher[]>('/api/teachers'),
        fetchAPI<Category[]>('/api/categories'),
      ]);
      setCourses(coursesData);
      setTeachers(teachersData);
      setCategories(categoriesData);

      // 找到当前家长的学员
      if (user) {
        const myStudent = studentsData.find((s: Student) => s.parent_id === user.id);
        if (myStudent) {
          setMyStudentId(myStudent.id);
          setMyStudentName(myStudent.name);

          // 获取孩子的课程安排
          const schedulesData = await fetchAPI<Schedule[]>(`/api/schedules?studentId=${myStudent.id}`);
          setSchedules(schedulesData);

          // 获取孩子涉及的所有分类
          const uniqueCategoryIds = [...new Set(schedulesData.map(s => s.category_id).filter(Boolean))];
          if (uniqueCategoryIds.length > 0) {
            // 默认显示第一个分类
            setActiveCategory(uniqueCategoryIds[0]);
            // 获取该分类的时间段
            const slotsData = await fetchAPI<TimeSlot[]>(`/api/time-slots?categoryId=${uniqueCategoryIds[0]}`);
            setTimeSlots(slotsData);
          } else {
            // 如果没有分类，使用通用时间段
            const slotsData = await fetchAPI<TimeSlot[]>('/api/time-slots');
            setTimeSlots(slotsData);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch data');
    }
  };

  // 切换分类时获取对应时间段
  const handleCategoryChange = async (categoryId: string | null) => {
    setActiveCategory(categoryId);
    try {
      let url = '/api/time-slots';
      if (categoryId) {
        url = `/api/time-slots?categoryId=${categoryId}`;
      }
      const slotsData = await fetchAPI<TimeSlot[]>(url);
      setTimeSlots(slotsData);
    } catch (err) {
      console.error('Failed to fetch time slots');
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // 周导航
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 匹配时间段
  const matchSlot = (schedule: Schedule, slot: TimeSlot) => {
    const time = schedule.time;
    if (time.includes('-')) {
      const [start, end] = time.split('-');
      return start.trim() === slot.start_time && end.trim() === slot.end_time;
    }
    return time === slot.start_time;
  };

  // 获取某天某时间段的课程（只显示自己孩子的）
  const getSchedulesForDayAndSlot = (date: Date, slot: TimeSlot) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(s => {
      const scheduleDate = new Date(s.date);
      const dateMatch = scheduleDate.toISOString().split('T')[0] === dateStr;
      const slotMatch = matchSlot(s, slot);
      const categoryMatch = !activeCategory || s.category_id === activeCategory;
      return dateMatch && slotMatch && categoryMatch;
    });
  };

  // 获取孩子涉及的分类列表
  const getChildCategories = () => {
    const uniqueCategoryIds = [...new Set(schedules.map(s => s.category_id).filter(Boolean))];
    return categories.filter(c => uniqueCategoryIds.includes(c.id));
  };

  // 点击空白格子快速添加
  const handleCellClick = (date: Date, slot: TimeSlot) => {
    const cellSchedules = getSchedulesForDayAndSlot(date, slot);
    if (cellSchedules.length === 0 && myStudentId) {
      setQuickAddData({
        date: date.toISOString().split('T')[0],
        startTime: slot.start_time,
        endTime: slot.end_time,
      });
      setShowModal(true);
    }
  };

  // 提交申请
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const courseId = formData.get('courseId') as string;
      const teacherId = formData.get('teacherId') as string;
      const message = formData.get('message') as string;

      await fetchAPI('/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          studentId: myStudentId,
          courseId,
          teacherId,
          date: quickAddData.date,
          time: `${quickAddData.startTime}-${quickAddData.endTime}`,
          message,
        }),
      });
      setShowModal(false);
      showToast('申请已提交，等待审核');
      fetchData();
    } catch (err) {
      console.error('Failed to submit enrollment');
      showToast('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return '待上课';
    }
  };

  // 当前分类名称
  const getCurrentCategoryName = () => {
    if (!activeCategory) return '所有课程';
    const cat = categories.find(c => c.id === activeCategory);
    return cat ? `${cat.name}课` : '所有课程';
  };

  return (
    <Layout role="parent">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-7 h-7" />
            课程表
          </h2>
          <div className="flex items-center gap-4">
            {myStudentName && (
              <span className="text-sm text-gray-500">
                我的孩子：<span className="font-medium text-blue-600">{myStudentName}</span>
              </span>
            )}
          </div>
        </div>

        {/* 分类标签页 - 只显示孩子涉及的分类 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            所有课程
          </button>
          {getChildCategories().map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat.name}课
            </button>
          ))}
        </div>

        {/* 课表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{getCurrentCategoryName()} - 本周课程表</h3>
              <div className="flex items-center gap-2">
                <button onClick={goToPreviousWeek} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={goToCurrentWeek} className="px-4 py-2 hover:bg-white/20 rounded-lg transition-colors text-sm">
                  今天
                </button>
                <button onClick={goToNextWeek} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="text-sm mt-2">
              {weekDays[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - {weekDays[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Week Days Header */}
              <div className="grid grid-cols-8 border-b bg-gray-50">
                <div className="p-3 text-center text-sm font-medium text-gray-500 border-r">时间段</div>
                {weekDays.map((date, index) => (
                  <div key={index} className={`p-3 text-center border-r ${isToday(date) ? 'bg-blue-50' : ''}`}>
                    <div className="text-sm font-medium text-gray-600">{weekDaysNames[index]}</div>
                    <div className={`text-lg font-bold mt-1 ${isToday(date) ? 'text-blue-600' : 'text-gray-800'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {timeSlots.length > 0 ? (
                timeSlots.map((slot) => (
                  <div key={slot.id} className="grid grid-cols-8 border-b">
                    <div className="p-3 text-center text-sm font-medium text-gray-500 border-r bg-gray-50">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-orange-600">{slot.start_time} - {slot.end_time}</span>
                      </div>
                    </div>
                    {weekDays.map((date, dayIndex) => {
                      const daySchedules = getSchedulesForDayAndSlot(date, slot);
                      const isEmpty = daySchedules.length === 0;
                      
                      return (
                        <div
                          key={dayIndex}
                          onClick={() => handleCellClick(date, slot)}
                          className={`p-2 border-r min-h-[80px] transition-colors
                            ${isToday(date) ? 'bg-blue-50/30' : ''}
                            ${isEmpty && myStudentId ? 'cursor-pointer hover:bg-cyan-50 hover:border-cyan-300' : ''}
                          `}
                        >
                          {daySchedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className={`${getStatusColor(schedule.status)} text-white p-3 rounded-lg mb-1`}
                            >
                              <div className="font-semibold text-sm">
                                {schedule.course_name}
                              </div>
                              <div className="text-xs opacity-90 mt-1">
                                {schedule.teacher_name}
                              </div>
                              <div className={`text-xs mt-1 bg-white/30 px-1.5 py-0.5 rounded inline-block ${
                                schedule.status === 'completed' ? 'text-green-100' :
                                schedule.status === 'cancelled' ? 'text-red-100' : 'text-blue-100'
                              }`}>
                                {getStatusText(schedule.status)}
                              </div>
                            </div>
                          ))}
                          {isEmpty && myStudentId && (
                            <div className="h-full flex items-center justify-center text-cyan-400">
                              <Plus className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {activeCategory ? '该分类暂无时间段设置' : '暂无时间段设置'}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-gray-600">待上课</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-600">已完成</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-600">已取消</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-100 border border-cyan-300 rounded flex items-center justify-center">
                  <Plus className="w-2 h-2 text-cyan-500" />
                </div>
                <span className="text-gray-600">点击空白格申请上课</span>
              </div>
            </div>
          </div>
        </div>

        {schedules.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            {myStudentName ? `${myStudentName}暂无课程安排` : '未找到学员信息'}
          </div>
        )}
      </div>

      {/* 快速添加申请模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">申请上课</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 p-3 bg-cyan-50 rounded-lg text-sm text-cyan-800">
              <strong>时间：</strong>{quickAddData.date} {quickAddData.startTime} - {quickAddData.endTime}
              <br />
              <strong>学员：</strong>{myStudentName}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择课程</label>
                <select name="courseId" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">请选择课程</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择教师</label>
                <select name="teacherId" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">请选择教师</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">留言/备注（选填）</label>
                <textarea name="message" className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} placeholder="请输入备注" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  取消
                </button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                  {submitting ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-white border border-green-200 shadow-lg rounded-lg px-4 py-3 flex items-center gap-2 z-50">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-gray-800">{toast}</span>
        </div>
      )}
    </Layout>
  );
};

export default ParentScheduleCalendar;
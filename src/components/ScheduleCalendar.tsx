import { useState } from 'react';
import { ChevronLeft, ChevronRight, User, BookOpen, Clock } from 'lucide-react';

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
}

interface ScheduleCalendarProps {
  schedules: Schedule[];
  timeSlots: TimeSlot[];
  teacherFilter?: string;
  categoryFilter?: string;
  onScheduleClick?: (schedule: Schedule) => void;
}

const ScheduleCalendar = ({ schedules, timeSlots, teacherFilter, categoryFilter, onScheduleClick }: ScheduleCalendarProps) => {
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

  const filteredSchedules = schedules.filter(s => {
    if (teacherFilter && s.teacher_id !== teacherFilter) return false;
    if (categoryFilter && s.category_id !== categoryFilter) return false;
    return true;
  });

  // 匹配时间段：schedule.time 可能是 "HH:MM" 或 "HH:MM-HH:MM" 格式
  const matchSlot = (schedule: Schedule, slot: TimeSlot) => {
    const time = schedule.time;
    if (time.includes('-')) {
      // 自定义格式 "HH:MM-HH:MM"
      const [start, end] = time.split('-');
      return start.trim() === slot.start_time && end.trim() === slot.end_time;
    }
    // 旧格式 "HH:MM"，用 start_time 匹配
    return time === slot.start_time;
  };

  const getSchedulesForDayAndSlot = (date: Date, slot: TimeSlot) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredSchedules.filter(s => {
      const scheduleDate = new Date(s.date);
      return scheduleDate.toISOString().split('T')[0] === dateStr && matchSlot(s, slot);
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">本周课程表</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-4 py-2 hover:bg-white/20 rounded-lg transition-colors text-sm"
            >
              今天
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
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
              <div
                key={index}
                className={`p-3 text-center border-r ${
                  isToday(date) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-600">{weekDaysNames[index]}</div>
                <div className={`text-lg font-bold mt-1 ${
                  isToday(date) ? 'text-blue-600' : 'text-gray-800'
                }`}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots - 动态从 timeSlots 渲染 */}
          {timeSlots.length > 0 ? (
            timeSlots.map((slot) => (
              <div key={slot.id} className="grid grid-cols-8 border-b hover:bg-gray-50">
                <div className="p-3 text-center text-sm font-medium text-gray-500 border-r bg-gray-50">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-orange-600">{slot.start_time} - {slot.end_time}</span>
                  </div>
                </div>
                {weekDays.map((date, dayIndex) => {
                  const daySchedules = getSchedulesForDayAndSlot(date, slot);
                  return (
                    <div
                      key={dayIndex}
                      className={`p-2 border-r min-h-[100px] ${
                        isToday(date) ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          onClick={() => onScheduleClick?.(schedule)}
                          className={`${getStatusColor(schedule.status)} text-white p-2 rounded-lg mb-1 cursor-pointer hover:opacity-90 transition-opacity text-xs`}
                        >
                          <div className="font-semibold flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {schedule.student_name}
                          </div>
                          <div className="flex items-center gap-1 mt-1 opacity-90">
                            <BookOpen className="w-3 h-3" />
                            {schedule.course_name}
                          </div>
                          {!teacherFilter && (
                            <div className="mt-1 opacity-75 text-xs">
                              {schedule.teacher_name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              暂无时间段，请先在"时间线管理"中添加时间段
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center gap-6 text-sm">
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
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;

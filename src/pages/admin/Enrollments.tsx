import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store';
import { Check, X, BookOpen, Users, Calendar, Clock, MessageSquare } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface Enrollment {
  id: string;
  student_id: string;
  student_name: string;
  parent_id: string;
  parent_name: string;
  course_id: string;
  course_name: string;
  teacher_id: string;
  teacher_name: string;
  date: string;
  time: string;
  message: string;
  status: string;
  created_at: string;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const AdminEnrollments = () => {
  const { user } = useStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [loading, setLoading] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'all'
        ? '/api/enrollments'
        : `/api/enrollments?status=${filterStatus}`;
      const data = await fetchAPI<Enrollment[]>(url);
      setEnrollments(data);
    } catch (err) {
      console.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [filterStatus]);

  const handleApprove = async (id: string) => {
    if (!user) return;
    try {
      await fetchAPI(`/api/enrollments/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ reviewedBy: user.id }),
      });
      fetchEnrollments();
    } catch (err) {
      console.error('Failed to approve enrollment');
    }
  };

  const handleReject = async (id: string) => {
    if (!user) return;
    try {
      await fetchAPI(`/api/enrollments/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reviewedBy: user.id }),
      });
      fetchEnrollments();
    } catch (err) {
      console.error('Failed to reject enrollment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已拒绝';
      default:
        return '待审核';
    }
  };

  const filterButtons: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已拒绝' },
  ];

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">申请审核</h2>

        <div className="flex items-center gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === btn.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">学员姓名</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">家长姓名</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">课程</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">教师</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">日期</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">时间</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">留言</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">申请时间</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800">{enrollment.student_name}</td>
                  <td className="px-6 py-4 text-gray-800">{enrollment.parent_name || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">{enrollment.course_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">{enrollment.teacher_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-800">{enrollment.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{enrollment.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    {enrollment.message ? (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-sm break-words">{enrollment.message}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {enrollment.created_at ? new Date(enrollment.created_at).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                      {getStatusText(enrollment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {enrollment.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(enrollment.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Check className="w-4 h-4" />
                          通过
                        </button>
                        <button
                          onClick={() => handleReject(enrollment.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <X className="w-4 h-4" />
                          拒绝
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">已处理</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {enrollments.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {loading ? '加载中...' : '暂无申请数据'}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminEnrollments;

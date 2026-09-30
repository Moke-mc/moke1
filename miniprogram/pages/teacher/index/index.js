// pages/teacher/index/index.js
const app = getApp()

Page({
  data: {
    user: null,
    todaySchedules: [],
    stats: { total: 0, completed: 0, pending: 0 },
    loading: true
  },

  onShow() {
    if (!app.globalData.userInfo) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    if (app.globalData.role !== 'teacher') return
    this.fetchData()
  },

  onPullDownRefresh() {
    this.fetchData().then(() => wx.stopPullDownRefresh())
  },

  async fetchData() {
    const teacherId = app.globalData.parentId // 复用 parentId 字段存 userId
    try {
      const schedules = await app.request({ url: `/api/schedules?teacherId=${teacherId}` })
      const today = new Date().toISOString().split('T')[0]
      const todaySchedules = (schedules || []).filter(s => s.date === today)
      const stats = {
        total: todaySchedules.length,
        completed: todaySchedules.filter(s => s.status === 'completed').length,
        pending: todaySchedules.filter(s => s.status === 'scheduled').length
      }
      this.setData({ todaySchedules, stats })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goStudents() { wx.navigateTo({ url: '/pages/teacher/students/students' }) },
  goCheckin() { wx.navigateTo({ url: '/pages/teacher/checkin/checkin' }) },
  goSchedule() { wx.navigateTo({ url: '/pages/teacher/schedule/schedule' }) },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (r) => {
        if (r.confirm) {
          app.logout()
          wx.reLaunch({ url: '/pages/login/login' })
        }
      }
    })
  }
})

// pages/parent/index/index.js
const app = getApp()

Page({
  data: {
    user: null,
    students: [],
    todaySchedules: [],
    loading: true
  },

  onShow() {
    if (!app.globalData.userInfo) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    if (app.globalData.role !== 'parent') return
    this.fetchData()
  },

  onPullDownRefresh() {
    this.fetchData().then(() => wx.stopPullDownRefresh())
  },

  async fetchData() {
    const parentId = app.globalData.parentId
    this.setData({ loading: true })
    try {
      const [students, schedules] = await Promise.all([
        app.request({ url: `/api/mp/my-students?parentId=${parentId}` }),
        app.request({ url: `/api/schedules` })
      ])
      const today = new Date().toISOString().split('T')[0]
      const myStudentIds = (students || []).map(s => s.id)
      const todaySchedules = (schedules || []).filter(s =>
        myStudentIds.includes(s.student_id) && s.date === today
      )
      this.setData({ students: students || [], todaySchedules })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goBind() {
    wx.navigateTo({ url: '/pages/parent/bind/bind' })
  },

  goSchedule() {
    wx.switchTab && wx.navigateTo({ url: '/pages/parent/schedule/schedule' })
  },

  goComments() {
    wx.navigateTo({ url: '/pages/parent/comments/comments' })
  },

  goProfile(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/parent/profile/profile?id=${id}` })
  },

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

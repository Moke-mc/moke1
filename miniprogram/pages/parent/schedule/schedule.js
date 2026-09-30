// pages/parent/schedule/schedule.js
const app = getApp()

Page({
  data: {
    students: [],
    currentStudentId: '',
    schedules: [],
    loading: true,
    filter: 'all' // all | upcoming | completed
  },

  async onLoad() {
    const parentId = app.globalData.parentId
    try {
      const students = await app.request({ url: `/api/mp/my-students?parentId=${parentId}` })
      this.setData({ students: students || [] })
      if (students && students.length > 0) {
        this.setData({ currentStudentId: students[0].id })
        await this.fetchSchedules()
      }
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async fetchSchedules() {
    if (!this.data.currentStudentId) return
    try {
      const data = await app.request({ url: `/api/schedules?studentId=${this.data.currentStudentId}` })
      this.filterSchedules(data || [])
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    }
  },

  filterSchedules(all) {
    const today = new Date().toISOString().split('T')[0]
    const { filter } = this.data
    let list = all
    if (filter === 'upcoming') {
      list = all.filter(s => s.date >= today && s.status === 'scheduled')
    } else if (filter === 'completed') {
      list = all.filter(s => s.status === 'completed')
    }
    this.setData({ schedules: list })
  },

  switchStudent(e) {
    this.setData({ currentStudentId: e.currentTarget.dataset.id }, () => this.fetchSchedules())
  },

  switchFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.filter })
    this.fetchSchedules()
  },

  onPullDownRefresh() {
    this.fetchSchedules().then(() => wx.stopPullDownRefresh())
  }
})

// pages/teacher/schedule/schedule.js
const app = getApp()

Page({
  data: { schedules: [], loading: true, filter: 'all' },

  async onLoad() { this.fetchData() },

  onPullDownRefresh() {
    this.fetchData().then(() => wx.stopPullDownRefresh())
  },

  async fetchData() {
    const teacherId = app.globalData.parentId
    try {
      const data = await app.request({ url: `/api/schedules?teacherId=${teacherId}` })
      let list = data || []
      const today = new Date().toISOString().split('T')[0]
      if (this.data.filter === 'upcoming') {
        list = list.filter(s => s.date >= today && s.status === 'scheduled')
      } else if (this.data.filter === 'completed') {
        list = list.filter(s => s.status === 'completed')
      }
      list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      this.setData({ schedules: list })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  switchFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.filter }, () => this.fetchData())
  }
})

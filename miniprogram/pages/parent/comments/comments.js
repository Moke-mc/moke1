// pages/parent/comments/comments.js
const app = getApp()

Page({
  data: {
    students: [],
    currentStudentId: '',
    comments: [],
    loading: true
  },

  async onLoad() {
    const parentId = app.globalData.parentId
    try {
      const students = await app.request({ url: `/api/mp/my-students?parentId=${parentId}` })
      this.setData({ students: students || [] })
      if (students && students.length > 0) {
        this.setData({ currentStudentId: students[0].id })
        await this.fetchComments()
      }
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async fetchComments() {
    if (!this.data.currentStudentId) return
    try {
      const data = await app.request({ url: `/api/lessons?studentId=${this.data.currentStudentId}` })
      this.setData({ comments: data || [] })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    }
  },

  switchStudent(e) {
    this.setData({ currentStudentId: e.currentTarget.dataset.id }, () => this.fetchComments())
  },

  onPullDownRefresh() {
    this.fetchComments().then(() => wx.stopPullDownRefresh())
  }
})

// pages/admin/schedules/schedules.js
const app = getApp()

Page({
  data: {
    schedules: [], teachers: [], students: [], courses: [],
    loading: true,
    showForm: false,
    form: { teacherId: '', studentId: '', courseId: '', date: '', time: '' }
  },

  onLoad() { this.fetchAll() },
  onPullDownRefresh() { this.fetchAll().then(() => wx.stopPullDownRefresh()) },

  async fetchAll() {
    try {
      const [schedules, teachers, students, courses] = await Promise.all([
        app.request({ url: '/api/schedules' }),
        app.request({ url: '/api/teachers' }),
        app.request({ url: '/api/students' }),
        app.request({ url: '/api/courses' })
      ])
      const today = new Date().toISOString().split('T')[0]
      const list = (schedules || []).sort((a, b) =>
        (b.date + b.time).localeCompare(a.date + a.time)
      )
      this.setData({ schedules: list, teachers: teachers || [], students: students || [], courses: courses || [] })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  showAdd() {
    const today = new Date().toISOString().split('T')[0]
    this.setData({
      showForm: true,
      form: { teacherId: '', studentId: '', courseId: '', date: today, time: '09:00' }
    })
  },

  hideForm() { this.setData({ showForm: false }) },

  onPickerChange(e) {
    const { field } = e.currentTarget.dataset
    const form = this.data.form
    const { index, value } = e.detail
    if (field === 'teacherId') {
      form.teacherId = this.data.teachers[index].id
    } else if (field === 'studentId') {
      form.studentId = this.data.students[index].id
    } else if (field === 'courseId') {
      form.courseId = this.data.courses[index].id
    } else {
      form[field] = value
    }
    this.setData({ form })
  },

  async submit() {
    const { form } = this.data
    if (!form.teacherId || !form.studentId || !form.courseId || !form.date || !form.time) {
      wx.showToast({ title: '请填写完整', icon: 'none' })
      return
    }
    wx.showLoading({ title: '保存中...' })
    try {
      await app.request({ url: '/api/schedules', method: 'POST', data: form })
      wx.hideLoading()
      wx.showToast({ title: '排课成功', icon: 'success' })
      this.setData({ showForm: false })
      this.fetchAll()
    } catch (err) {
      wx.hideLoading()
      wx.showModal({ title: '保存失败', content: err.message, showCancel: false })
    }
  },

  del(e) {
    const s = e.currentTarget.dataset.schedule
    wx.showModal({
      title: '删除确认', content: `确定要删除 ${s.student_name} 的 ${s.course_name} 排课吗？`,
      success: async (r) => {
        if (!r.confirm) return
        try {
          await app.request({ url: `/api/schedules/${s.id}`, method: 'DELETE' })
          wx.showToast({ title: '已删除', icon: 'success' })
          this.fetchAll()
        } catch (err) {
          wx.showModal({ title: '删除失败', content: err.message, showCancel: false })
        }
      }
    })
  }
})

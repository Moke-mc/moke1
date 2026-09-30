// pages/admin/students/students.js
const app = getApp()

Page({
  data: {
    students: [],
    loading: true,
    showForm: false,
    editingId: '',
    form: {
      name: '', phone: '', parentName: '', parentPhone: '',
      totalLessons: 0, subject: '', parentUsername: '', parentPassword: ''
    }
  },

  onLoad() { this.fetch() },

  onPullDownRefresh() { this.fetch().then(() => wx.stopPullDownRefresh()) },

  async fetch() {
    try {
      const data = await app.request({ url: '/api/students' })
      this.setData({ students: data || [] })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  showAdd() {
    this.setData({
      showForm: true,
      editingId: '',
      form: {
        name: '', phone: '', parentName: '', parentPhone: '',
        totalLessons: 0, subject: '', parentUsername: '', parentPassword: ''
      }
    })
  },

  showEdit(e) {
    const s = e.currentTarget.dataset.student
    this.setData({
      showForm: true,
      editingId: s.id,
      form: {
        name: s.name, phone: s.phone, parentName: s.parent_name || '',
        parentPhone: '', totalLessons: s.total_lessons, subject: s.subject || '',
        parentUsername: s.parent_username || '', parentPassword: ''
      }
    })
  },

  hideForm() { this.setData({ showForm: false }) },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    const form = this.data.form
    form[field] = e.detail.value
    this.setData({ form })
  },

  async submit() {
    const { form, editingId } = this.data
    if (!form.name || !form.phone) {
      wx.showToast({ title: '请填写姓名和手机号', icon: 'none' })
      return
    }
    wx.showLoading({ title: '保存中...' })
    try {
      if (editingId) {
        await app.request({ url: `/api/students/${editingId}`, method: 'PUT', data: form })
      } else {
        if (!form.parentName || !form.parentPhone) {
          wx.hideLoading()
          wx.showToast({ title: '请填写家长信息', icon: 'none' })
          return
        }
        await app.request({ url: '/api/students', method: 'POST', data: form })
      }
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ showForm: false })
      this.fetch()
    } catch (err) {
      wx.hideLoading()
      wx.showModal({ title: '保存失败', content: err.message, showCancel: false })
    }
  },

  del(e) {
    const s = e.currentTarget.dataset.student
    wx.showModal({
      title: '删除确认',
      content: `确定要删除学员 ${s.name} 吗？该操作会同时删除其家长账号`,
      success: async (r) => {
        if (!r.confirm) return
        try {
          await app.request({ url: `/api/students/${s.id}`, method: 'DELETE' })
          wx.showToast({ title: '已删除', icon: 'success' })
          this.fetch()
        } catch (err) {
          wx.showModal({ title: '删除失败', content: err.message, showCancel: false })
        }
      }
    })
  }
})

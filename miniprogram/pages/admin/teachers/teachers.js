// pages/admin/teachers/teachers.js
const app = getApp()

Page({
  data: {
    teachers: [],
    loading: true,
    showForm: false,
    editingId: '',
    form: { name: '', phone: '', email: '', subject: '', username: '', password: '' }
  },

  onLoad() { this.fetch() },
  onPullDownRefresh() { this.fetch().then(() => wx.stopPullDownRefresh()) },

  async fetch() {
    try {
      const data = await app.request({ url: '/api/teachers' })
      this.setData({ teachers: data || [] })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  showAdd() {
    this.setData({
      showForm: true, editingId: '',
      form: { name: '', phone: '', email: '', subject: '', username: '', password: '' }
    })
  },

  showEdit(e) {
    const t = e.currentTarget.dataset.teacher
    // 同时拿到 users 表中的 username
    const user = wx.getStorageSync('userInfo') // 仅作占位
    this.setData({
      showForm: true, editingId: t.id,
      form: {
        name: t.name, phone: t.phone, email: t.email || '',
        subject: t.subject, username: '', password: ''
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
    if (!form.name || !form.phone || !form.subject) {
      wx.showToast({ title: '请填写姓名/手机/科目', icon: 'none' })
      return
    }
    wx.showLoading({ title: '保存中...' })
    try {
      if (editingId) {
        await app.request({ url: `/api/teachers/${editingId}`, method: 'PUT', data: form })
      } else {
        await app.request({ url: '/api/teachers', method: 'POST', data: form })
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
    const t = e.currentTarget.dataset.teacher
    wx.showModal({
      title: '删除确认',
      content: `确定要删除教师 ${t.name} 吗？`,
      success: async (r) => {
        if (!r.confirm) return
        try {
          await app.request({ url: `/api/teachers/${t.id}`, method: 'DELETE' })
          wx.showToast({ title: '已删除', icon: 'success' })
          this.fetch()
        } catch (err) {
          wx.showModal({ title: '删除失败', content: err.message, showCancel: false })
        }
      }
    })
  }
})

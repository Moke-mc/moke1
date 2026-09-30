// pages/parent/bind/bind.js
const app = getApp()

Page({
  data: {
    studentPhone: '',
    studentName: '',
    loading: false
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value })
  },

  // 获取微信手机号（一键填写）
  async getPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') return
    // 此处省略解密手机号步骤。生产环境需要：
    // 1. 把 e.detail.code 传给后端
    // 2. 后端调用微信 phonenumber.getPhoneNumber 接口解密
    // 这里仅作演示，开发模式可手动输入
    wx.showToast({ title: '请手动输入手机号', icon: 'none' })
  },

  async submit() {
    const { studentPhone, studentName } = this.data
    if (!studentPhone) {
      wx.showToast({ title: '请输入学生手机号', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const res = await app.request({
        url: '/api/mp/bind-student',
        method: 'POST',
        data: {
          parentId: app.globalData.parentId,
          studentPhone,
          studentName
        }
      })
      wx.showModal({
        title: '绑定成功',
        content: `已绑定学生：${res.student.name}`,
        showCancel: false,
        success: () => wx.navigateBack()
      })
    } catch (err) {
      // 后端返回的 message 在 res.data 里，request 已统一抛出
      wx.showModal({ title: '绑定失败', content: err.message, showCancel: false })
    } finally {
      this.setData({ loading: false })
    }
  }
})

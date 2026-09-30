// pages/admin/index/index.js
const app = getApp()

Page({
  data: {
    user: null,
    stats: {},
    loading: true
  },

  onShow() {
    if (!app.globalData.userInfo) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    if (app.globalData.role !== 'admin') return
    this.fetchData()
  },

  onPullDownRefresh() {
    this.fetchData().then(() => wx.stopPullDownRefresh())
  },

  async fetchData() {
    try {
      const data = await app.request({ url: '/api/auth/dashboard' })
      this.setData({ stats: data })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  go(e) { wx.navigateTo({ url: e.currentTarget.dataset.url }) },

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

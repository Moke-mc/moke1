// pages/login/login.js
const app = getApp()

Page({
  data: {
    loginType: 'wx', // wx | pwd
    username: '',
    password: '',
    loading: false,
    canWxLogin: true // 没配置 AppID 时改为 false，强制走账号密码
  },

  onLoad() {
    // 检查是否已登录
    if (app.globalData.userInfo) {
      app.navigateToHome(app.globalData.role)
    }
  },

  // 切换登录方式
  switchType(e) {
    this.setData({ loginType: e.currentTarget.dataset.type })
  },

  // 输入框
  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value })
  },

  // 微信一键登录
  async wxLogin() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      // 1. 获取微信 code
      const { code } = await wx.login()

      // 2. 获取用户头像和昵称（需要用户主动点击授权）
      // 注：getUserProfile 在新版本已废弃，建议通过 open-type="chooseAvatar" 的 button 获取头像
      // 此处简化处理，登录时只拿 code，昵称头像留待绑定学生后再获取
      const res = await app.request({
        url: '/api/mp/wx-login',
        method: 'POST',
        data: { code, nickName: '', avatarUrl: '' }
      })

      app.saveLogin(res.user, res.token)
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => app.navigateToHome(res.user.role), 500)
    } catch (err) {
      wx.showModal({ title: '登录失败', content: err.message, showCancel: false })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 账号密码登录
  async pwdLogin() {
    const { username, password } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      const res = await app.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { username, password }
      })
      app.saveLogin(res.user, `pwd_${res.user.id}_${Date.now()}`)
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => app.navigateToHome(res.user.role), 500)
    } catch (err) {
      wx.showModal({ title: '登录失败', content: err.message, showCancel: false })
    } finally {
      this.setData({ loading: false })
    }
  }
})

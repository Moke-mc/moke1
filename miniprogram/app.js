// app.js - 全局入口
const config = require('./config.js')

App({
  globalData: {
    userInfo: null,
    token: null,
    role: null,
    parentId: null,
    apiBase: config.apiBase
  },

  onLaunch() {
    // 读取本地缓存的登录信息
    const userInfo = wx.getStorageSync('userInfo')
    const token = wx.getStorageSync('token')
    if (userInfo && token) {
      this.globalData.userInfo = userInfo
      this.globalData.token = token
      this.globalData.role = userInfo.role
      this.globalData.parentId = userInfo.id
    }
  },

  // 全局请求封装
  request(options) {
    return new Promise((resolve, reject) => {
      const url = options.url.startsWith('http') ? options.url : this.globalData.apiBase + options.url
      wx.request({
        url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          ...(this.globalData.token ? { Authorization: `Bearer ${this.globalData.token}` } : {}),
          ...(options.header || {})
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else if (res.statusCode === 401) {
            // 登录失效，跳转到登录页
            this.logout()
            wx.reLaunch({ url: '/pages/login/login' })
            reject(new Error('登录失效，请重新登录'))
          } else {
            reject(new Error(res.data.message || `请求失败 (${res.statusCode})`))
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '网络错误'))
        }
      })
    })
  },

  // 保存登录信息
  saveLogin(userInfo, token) {
    this.globalData.userInfo = userInfo
    this.globalData.token = token
    this.globalData.role = userInfo.role
    this.globalData.parentId = userInfo.id
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('token', token)
  },

  // 退出登录
  logout() {
    this.globalData.userInfo = null
    this.globalData.token = null
    this.globalData.role = null
    this.globalData.parentId = null
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('token')
  },

  // 根据角色跳转到首页
  navigateToHome(role) {
    const map = {
      parent: '/pages/parent/index/index',
      teacher: '/pages/teacher/index/index',
      admin: '/pages/admin/index/index'
    }
    const url = map[role] || '/pages/login/login'
    wx.reLaunch({ url })
  }
})

// pages/teacher/checkin/checkin.js
const app = getApp()

Page({
  data: {
    schedules: [],
    loading: true
  },

  onShow() {
    this.fetchData()
  },

  onPullDownRefresh() {
    this.fetchData().then(() => wx.stopPullDownRefresh())
  },

  async fetchData() {
    const teacherId = app.globalData.parentId
    const today = new Date().toISOString().split('T')[0]
    try {
      const data = await app.request({ url: `/api/schedules?teacherId=${teacherId}` })
      // 显示今天及以后、未签到的课
      const list = (data || []).filter(s => s.date >= today && s.status === 'scheduled')
      list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      this.setData({ schedules: list })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async doCheckin(e) {
    const schedule = e.currentTarget.dataset.schedule
    const comment = await this.showCommentInput()
    if (comment === false) return
    wx.showLoading({ title: '签到中...' })
    try {
      await app.request({
        url: '/api/lessons/checkin',
        method: 'POST',
        data: {
          scheduleId: schedule.id,
          teacherId: schedule.teacher_id,
          studentId: schedule.student_id,
          courseId: schedule.course_id,
          comment: comment || ''
        }
      })
      wx.hideLoading()
      wx.showToast({ title: '签到成功', icon: 'success' })
      this.fetchData()
    } catch (err) {
      wx.hideLoading()
      wx.showModal({ title: '签到失败', content: err.message, showCancel: false })
    }
  },

  // 弹出点评输入框
  showCommentInput() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '课后点评',
        content: '是否填写课后点评？',
        confirmText: '填写',
        cancelText: '跳过',
        success: (r) => {
          if (!r.confirm) return resolve('')
          wx.showModal({
            title: '课后点评',
            editable: true,
            placeholderText: '请输入课后点评（可填学员表现、建议等）',
            success: (r2) => {
              if (r2.confirm) resolve(r2.content || '')
              else resolve(false)
            },
            fail: () => resolve(false)
          })
        }
      })
    })
  }
})

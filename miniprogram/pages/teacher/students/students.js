// pages/teacher/students/students.js
const app = getApp()

Page({
  data: { students: [], loading: true },

  async onLoad() {
    const teacherId = app.globalData.parentId
    try {
      const data = await app.request({ url: `/api/schedules?teacherId=${teacherId}` })
      const map = new Map()
      ;(data || []).forEach(s => {
        if (!map.has(s.student_id)) {
          map.set(s.student_id, {
            id: s.student_id,
            name: s.student_name,
            course: s.course_name,
            count: 1
          })
        } else {
          map.get(s.student_id).count++
        }
      })
      this.setData({ students: Array.from(map.values()) })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})

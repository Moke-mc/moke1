// pages/parent/profile/profile.js
const app = getApp()

Page({
  data: {
    student: null,
    editing: false,
    editData: {
      photo: '',
      gender: '',
      birthDate: '',
      school: '',
      grade: '',
      address: '',
      competitionExperiences: []
    },
    newExp: { name: '', date: '', result: '', description: '' },
    loading: true
  },

  async onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '缺少学生ID', icon: 'none' })
      return
    }
    try {
      const student = await app.request({ url: `/api/students/${options.id}` })
      const exps = student.competition_experiences
        ? (typeof student.competition_experiences === 'string'
            ? JSON.parse(student.competition_experiences)
            : student.competition_experiences)
        : []
      this.setData({
        student,
        editData: {
          photo: student.photo || '',
          gender: student.gender || '',
          birthDate: student.birth_date || '',
          school: student.school || '',
          grade: student.grade || '',
          address: student.address || '',
          competitionExperiences: exps
        }
      })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  toggleEdit() {
    this.setData({ editing: !this.data.editing })
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    const editData = this.data.editData
    editData[field] = e.detail.value
    this.setData({ editData })
  },

  onGenderChange(e) {
    const editData = this.data.editData
    editData.gender = e.detail.value === '0' ? '男' : '女'
    this.setData({ editData })
  },

  onDateChange(e) {
    const editData = this.data.editData
    editData.birthDate = e.detail.value
    this.setData({ editData })
  },

  // 选择照片
  async choosePhoto() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      })
      const tempPath = res.tempFiles[0].tempFilePath
      wx.showLoading({ title: '处理中...' })
      // 读取为 base64
      const fs = wx.getFileSystemManager()
      const base64 = fs.readFileSync(tempPath, 'base64')
      const ext = tempPath.split('.').pop() || 'jpg'
      const dataUrl = `data:image/${ext};base64,${base64}`
      const editData = this.data.editData
      editData.photo = dataUrl
      this.setData({ editData })
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      if (err.errMsg && err.errMsg.indexOf('cancel') !== -1) return
      wx.showToast({ title: '选择照片失败', icon: 'none' })
    }
  },

  removePhoto() {
    const editData = this.data.editData
    editData.photo = ''
    this.setData({ editData })
  },

  // 比赛经历
  onExpInput(e) {
    const { field } = e.currentTarget.dataset
    const newExp = this.data.newExp
    newExp[field] = e.detail.value
    this.setData({ newExp })
  },

  addExp() {
    const { newExp } = this.data
    if (!newExp.name) {
      wx.showToast({ title: '请输入比赛名称', icon: 'none' })
      return
    }
    const editData = this.data.editData
    editData.competitionExperiences = [...editData.competitionExperiences, newExp]
    this.setData({
      editData,
      newExp: { name: '', date: '', result: '', description: '' }
    })
  },

  removeExp(e) {
    const idx = e.currentTarget.dataset.idx
    const editData = this.data.editData
    editData.competitionExperiences.splice(idx, 1)
    this.setData({ editData })
  },

  // 保存
  async save() {
    const { student, editData } = this.data
    try {
      const res = await app.request({
        url: `/api/students/${student.id}`,
        method: 'PUT',
        data: {
          name: student.name,
          phone: student.phone,
          totalLessons: student.total_lessons,
          subject: student.subject,
          photo: editData.photo,
          gender: editData.gender,
          birthDate: editData.birthDate,
          school: editData.school,
          grade: editData.grade,
          address: editData.address,
          competitionExperiences: editData.competitionExperiences
        }
      })
      this.setData({ student: res, editing: false })
      wx.showToast({ title: '保存成功', icon: 'success' })
    } catch (err) {
      wx.showModal({ title: '保存失败', content: err.message, showCancel: false })
    }
  }
})

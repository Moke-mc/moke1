import { Router } from 'express';
import db from '../db';

const router = Router();

// 用户登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? AND password = ?'
  ).get(username, password) as any;
  
  if (user) {
    // 登录成功
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        name: user.name 
      } 
    });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

// 获取仪表板统计数据
router.get('/dashboard', (req, res) => {
  const teacherCount = db.prepare('SELECT COUNT(*) as count FROM teachers').get() as any;
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get() as any;
  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get() as any;
  const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lesson_records').get() as any;
  const today = new Date().toISOString().split('T')[0];
  const todayLessons = db.prepare('SELECT COUNT(*) as count FROM schedules WHERE date = ?').get(today) as any;
  
  res.json({
    teacherCount: teacherCount.count,
    studentCount: studentCount.count,
    courseCount: courseCount.count,
    lessonCount: lessonCount.count,
    todayLessons: todayLessons.count
  });
});

export default router

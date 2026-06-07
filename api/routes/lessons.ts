import { Router } from 'express';
import db from '../db';

const router = Router();

// 获取所有课时记录
router.get('/', (req, res) => {
  const { teacherId, studentId } = req.query;
  let query = `
    SELECT lr.*, t.name as teacher_name, st.name as student_name, c.name as course_name
    FROM lesson_records lr
    JOIN teachers t ON lr.teacher_id = t.id
    JOIN students st ON lr.student_id = st.id
    JOIN courses c ON lr.course_id = c.id
  `;
  const params: string[] = [];
  
  if (teacherId) {
    query += ' WHERE lr.teacher_id = ?';
    params.push(teacherId as string);
  }
  
  if (studentId) {
    query += teacherId ? ' AND lr.student_id = ?' : ' WHERE lr.student_id = ?';
    params.push(studentId as string);
  }
  
  query += ' ORDER BY lr.date DESC';
  
  const records = db.prepare(query).all(...params);
  res.json(records);
});

// 核销课时
router.post('/checkin', (req, res) => {
  const { scheduleId, teacherId, studentId, courseId, comment } = req.body;
  const id = `lesson-${Date.now()}`;
  const date = new Date().toISOString().split('T')[0];
  
  // 创建课时记录
  db.prepare(
    'INSERT INTO lesson_records (id, schedule_id, teacher_id, student_id, course_id, date, comment) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, scheduleId, teacherId, studentId, courseId, date, comment);
  
  // 更新学员已上课时
  db.prepare(
    'UPDATE students SET used_lessons = used_lessons + 1 WHERE id = ?'
  ).run(studentId);
  
  // 更新排班状态
  db.prepare(
    'UPDATE schedules SET status = ? WHERE id = ?'
  ).run('completed', scheduleId);
  
  const record = db.prepare(`
    SELECT lr.*, t.name as teacher_name, st.name as student_name, c.name as course_name
    FROM lesson_records lr
    JOIN teachers t ON lr.teacher_id = t.id
    JOIN students st ON lr.student_id = st.id
    JOIN courses c ON lr.course_id = c.id
    WHERE lr.id = ?
  `).get(id);
  res.json(record);
});

export default router;

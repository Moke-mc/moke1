import { Router } from 'express';
import db from '../db';

const router = Router();

// 获取所有排班
router.get('/', (req, res) => {
  const { teacherId, studentId } = req.query;
  let query = `
    SELECT s.*, t.name as teacher_name, st.name as student_name, c.name as course_name
    FROM schedules s
    JOIN teachers t ON s.teacher_id = t.id
    JOIN students st ON s.student_id = st.id
    JOIN courses c ON s.course_id = c.id
  `;
  const params: string[] = [];
  
  if (teacherId) {
    query += ' WHERE s.teacher_id = ?';
    params.push(teacherId as string);
  }
  
  if (studentId) {
    query += teacherId ? ' AND s.student_id = ?' : ' WHERE s.student_id = ?';
    params.push(studentId as string);
  }
  
  query += ' ORDER BY s.date DESC, s.time DESC';
  
  const schedules = db.prepare(query).all(...params);
  res.json(schedules);
});

// 创建排班
router.post('/', (req, res) => {
  const { teacherId, studentId, courseId, date, time } = req.body;
  const id = `schedule-${Date.now()}`;
  db.prepare(
    'INSERT INTO schedules (id, teacher_id, student_id, course_id, date, time, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, teacherId, studentId, courseId, date, time, 'scheduled');
  
  const schedule = db.prepare(`
    SELECT s.*, t.name as teacher_name, st.name as student_name, c.name as course_name
    FROM schedules s
    JOIN teachers t ON s.teacher_id = t.id
    JOIN students st ON s.student_id = st.id
    JOIN courses c ON s.course_id = c.id
    WHERE s.id = ?
  `).get(id);
  res.json(schedule);
});

// 更新排班
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { teacherId, studentId, courseId, date, time, status } = req.body;
  db.prepare(
    'UPDATE schedules SET teacher_id = ?, student_id = ?, course_id = ?, date = ?, time = ?, status = ? WHERE id = ?'
  ).run(teacherId, studentId, courseId, date, time, status, id);
  
  const schedule = db.prepare(`
    SELECT s.*, t.name as teacher_name, st.name as student_name, c.name as course_name
    FROM schedules s
    JOIN teachers t ON s.teacher_id = t.id
    JOIN students st ON s.student_id = st.id
    JOIN courses c ON s.course_id = c.id
    WHERE s.id = ?
  `).get(id);
  res.json(schedule);
});

// 删除排班
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;

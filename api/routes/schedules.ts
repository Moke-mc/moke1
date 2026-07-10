import { Router } from 'express';
import db from '../db';

const router = Router();

// 获取所有排班
router.get('/', (req, res) => {
  const { teacherId, studentId, categoryId } = req.query;
  let query = `
    SELECT s.*, t.name as teacher_name, st.name as student_name, c.name as course_name,
      cc.name as category_name
    FROM schedules s
    JOIN teachers t ON s.teacher_id = t.id
    JOIN students st ON s.student_id = st.id
    JOIN courses c ON s.course_id = c.id
    LEFT JOIN course_categories cc ON s.category_id = cc.id
  `;
  const params: string[] = [];
  const conditions: string[] = [];
  
  if (teacherId) {
    conditions.push('s.teacher_id = ?');
    params.push(teacherId as string);
  }
  
  if (studentId) {
    conditions.push('s.student_id = ?');
    params.push(studentId as string);
  }

  if (categoryId) {
    conditions.push('s.category_id = ?');
    params.push(categoryId as string);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY s.date DESC, s.time DESC';
  
  const schedules = db.prepare(query).all(...params);
  res.json(schedules);
});

// 创建排班
router.post('/', (req, res) => {
  const { teacherId, studentId, courseId, date, time, categoryId } = req.body;
  const id = `schedule-${Date.now()}`;
  db.prepare(
    'INSERT INTO schedules (id, teacher_id, student_id, course_id, date, time, status, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, teacherId, studentId, courseId, date, time, 'scheduled', categoryId || null);
  
  const schedule = db.prepare(`
    SELECT s.*, t.name as teacher_name, st.name as student_name, c.name as course_name,
      cc.name as category_name
    FROM schedules s
    JOIN teachers t ON s.teacher_id = t.id
    JOIN students st ON s.student_id = st.id
    JOIN courses c ON s.course_id = c.id
    LEFT JOIN course_categories cc ON s.category_id = cc.id
    WHERE s.id = ?
  `).get(id);
  res.json(schedule);
});

// 更新排班
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { teacherId, studentId, courseId, date, time, status, categoryId } = req.body;
  db.prepare(
    'UPDATE schedules SET teacher_id = ?, student_id = ?, course_id = ?, date = ?, time = ?, status = ?, category_id = ? WHERE id = ?'
  ).run(teacherId, studentId, courseId, date, time, status, categoryId || null, id);
  
  const schedule = db.prepare(`
    SELECT s.*, t.name as teacher_name, st.name as student_name, c.name as course_name,
      cc.name as category_name
    FROM schedules s
    JOIN teachers t ON s.teacher_id = t.id
    JOIN students st ON s.student_id = st.id
    JOIN courses c ON s.course_id = c.id
    LEFT JOIN course_categories cc ON s.category_id = cc.id
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

import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';

const router = Router();

// 获取所有申请（支持 status 筛选）
router.get('/', (req, res) => {
  const { status, parentId, teacherId, studentId } = req.query;
  let query = `
    SELECT e.*, 
      s.name as student_name, 
      p.name as parent_name,
      t.name as teacher_name,
      c.name as course_name,
      sch.date as schedule_date,
      sch.time as schedule_time
    FROM enrollments e
    LEFT JOIN students s ON e.student_id = s.id
    LEFT JOIN parents p ON e.parent_id = p.id
    LEFT JOIN teachers t ON e.teacher_id = t.id
    LEFT JOIN courses c ON e.course_id = c.id
    LEFT JOIN schedules sch ON e.schedule_id = sch.id
  `;
  const params: string[] = [];
  const conditions: string[] = [];

  if (status) {
    conditions.push('e.status = ?');
    params.push(status as string);
  }
  if (parentId) {
    conditions.push('e.parent_id = ?');
    params.push(parentId as string);
  }
  if (teacherId) {
    conditions.push('e.teacher_id = ?');
    params.push(teacherId as string);
  }
  if (studentId) {
    conditions.push('e.student_id = ?');
    params.push(studentId as string);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY e.created_at DESC';

  const enrollments = db.prepare(query).all(...params);
  res.json(enrollments);
});

// 获取待审核申请
router.get('/pending', (req, res) => {
  const enrollments = db.prepare(`
    SELECT e.*, 
      s.name as student_name, 
      p.name as parent_name,
      t.name as teacher_name,
      c.name as course_name,
      sch.date as schedule_date,
      sch.time as schedule_time
    FROM enrollments e
    LEFT JOIN students s ON e.student_id = s.id
    LEFT JOIN parents p ON e.parent_id = p.id
    LEFT JOIN teachers t ON e.teacher_id = t.id
    LEFT JOIN courses c ON e.course_id = c.id
    LEFT JOIN schedules sch ON e.schedule_id = sch.id
    WHERE e.status = 'pending'
    ORDER BY e.created_at DESC
  `).all();
  res.json(enrollments);
});

// 家长提交申请
router.post('/', (req, res) => {
  const {
    studentId,
    scheduleId,
    courseId,
    teacherId,
    date,
    time,
    parentId,
    message,
  } = req.body;

  // 通过 studentId 自动获取 parent_id（如果未传）
  let resolvedParentId = parentId;
  if (!resolvedParentId && studentId) {
    const student = db.prepare('SELECT parent_id FROM students WHERE id = ?').get(studentId) as any;
    if (student) {
      resolvedParentId = student.parent_id;
    }
  }

  const id = `enrollment-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO enrollments 
      (id, student_id, schedule_id, course_id, teacher_id, date, time, status, parent_id, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `).run(
    id,
    studentId,
    scheduleId || null,
    courseId || null,
    teacherId || null,
    date || null,
    time || null,
    resolvedParentId || null,
    message || null,
    createdAt
  );

  const enrollment = db.prepare(`
    SELECT e.*, 
      s.name as student_name, 
      p.name as parent_name,
      t.name as teacher_name,
      c.name as course_name,
      sch.date as schedule_date,
      sch.time as schedule_time
    FROM enrollments e
    LEFT JOIN students s ON e.student_id = s.id
    LEFT JOIN parents p ON e.parent_id = p.id
    LEFT JOIN teachers t ON e.teacher_id = t.id
    LEFT JOIN courses c ON e.course_id = c.id
    LEFT JOIN schedules sch ON e.schedule_id = sch.id
    WHERE e.id = ?
  `).get(id);
  res.json(enrollment);
});

// 管理员/老师批准申请（自动创建 schedule）
router.put('/:id/approve', (req, res) => {
  const { id } = req.params;
  const { reviewedBy } = req.body;

  const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(id) as any;
  if (!enrollment) {
    res.status(404).json({ success: false, message: '申请不存在' });
    return;
  }
  if (enrollment.status !== 'pending') {
    res.status(400).json({ success: false, message: '该申请已处理' });
    return;
  }

  const reviewedAt = new Date().toISOString();
  let scheduleId = enrollment.schedule_id;

  // 如果申请未关联现有 schedule，且包含 course/teacher/date/time，则自动创建 schedule
  if (!scheduleId && enrollment.course_id && enrollment.teacher_id && enrollment.date && enrollment.time) {
    scheduleId = `schedule-${Date.now()}`;
    db.prepare(`
      INSERT INTO schedules (id, teacher_id, student_id, course_id, date, time, status)
      VALUES (?, ?, ?, ?, ?, ?, 'scheduled')
    `).run(
      scheduleId,
      enrollment.teacher_id,
      enrollment.student_id,
      enrollment.course_id,
      enrollment.date,
      enrollment.time
    );
  }

  // 更新申请状态为已批准
  db.prepare(`
    UPDATE enrollments 
    SET status = 'approved', reviewed_by = ?, reviewed_at = ?, schedule_id = ?
    WHERE id = ?
  `).run(reviewedBy || null, reviewedAt, scheduleId, id);

  const updated = db.prepare(`
    SELECT e.*, 
      s.name as student_name, 
      p.name as parent_name,
      t.name as teacher_name,
      c.name as course_name,
      sch.date as schedule_date,
      sch.time as schedule_time
    FROM enrollments e
    LEFT JOIN students s ON e.student_id = s.id
    LEFT JOIN parents p ON e.parent_id = p.id
    LEFT JOIN teachers t ON e.teacher_id = t.id
    LEFT JOIN courses c ON e.course_id = c.id
    LEFT JOIN schedules sch ON e.schedule_id = sch.id
    WHERE e.id = ?
  `).get(id);
  res.json(updated);
});

// 管理员/老师拒绝申请
router.put('/:id/reject', (req, res) => {
  const { id } = req.params;
  const { reviewedBy } = req.body;

  const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(id) as any;
  if (!enrollment) {
    res.status(404).json({ success: false, message: '申请不存在' });
    return;
  }
  if (enrollment.status !== 'pending') {
    res.status(400).json({ success: false, message: '该申请已处理' });
    return;
  }

  const reviewedAt = new Date().toISOString();
  db.prepare(`
    UPDATE enrollments 
    SET status = 'rejected', reviewed_by = ?, reviewed_at = ?
    WHERE id = ?
  `).run(reviewedBy || null, reviewedAt, id);

  const updated = db.prepare(`
    SELECT e.*, 
      s.name as student_name, 
      p.name as parent_name,
      t.name as teacher_name,
      c.name as course_name,
      sch.date as schedule_date,
      sch.time as schedule_time
    FROM enrollments e
    LEFT JOIN students s ON e.student_id = s.id
    LEFT JOIN parents p ON e.parent_id = p.id
    LEFT JOIN teachers t ON e.teacher_id = t.id
    LEFT JOIN courses c ON e.course_id = c.id
    LEFT JOIN schedules sch ON e.schedule_id = sch.id
    WHERE e.id = ?
  `).get(id);
  res.json(updated);
});

// 删除申请
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM enrollments WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;

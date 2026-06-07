import { Router } from 'express';
import db from '../db';

const router = Router();

// 获取所有学员
router.get('/', (req, res) => {
  const students = db.prepare(`
    SELECT s.*, p.name as parent_name 
    FROM students s 
    JOIN parents p ON s.parent_id = p.id
  `).all();
  res.json(students);
});

// 创建学员
router.post('/', (req, res) => {
  const { name, phone, parentName, parentPhone, totalLessons, subject } = req.body;
  const parentId = `parent-${Date.now()}`;
  const studentId = `student-${Date.now()}`;
  
  // 创建家长
  db.prepare(
    'INSERT INTO parents (id, name, phone) VALUES (?, ?, ?)'
  ).run(parentId, parentName, parentPhone);
  
  // 创建家长用户账号
  db.prepare(
    'INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)'
  ).run(parentId, `parent${Date.now()}`, '123456', 'parent', parentName);
  
  // 创建学员
  db.prepare(
    'INSERT INTO students (id, name, phone, parent_id, total_lessons, used_lessons, subject) VALUES (?, ?, ?, ?, ?, 0, ?)'
  ).run(studentId, name, phone, parentId, totalLessons, subject);
  
  const student = db.prepare(`
    SELECT s.*, p.name as parent_name 
    FROM students s 
    JOIN parents p ON s.parent_id = p.id
    WHERE s.id = ?
  `).get(studentId);
  res.json(student);
});

// 更新学员
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, totalLessons, subject } = req.body;
  db.prepare(
    'UPDATE students SET name = ?, phone = ?, total_lessons = ?, subject = ? WHERE id = ?'
  ).run(name, phone, totalLessons, subject, id);
  
  const student = db.prepare(`
    SELECT s.*, p.name as parent_name 
    FROM students s 
    JOIN parents p ON s.parent_id = p.id
    WHERE s.id = ?
  `).get(id);
  res.json(student);
});

// 删除学员
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
  if (student) {
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
    db.prepare('DELETE FROM parents WHERE id = ?').run(student.parent_id);
    db.prepare('DELETE FROM users WHERE id = ?').run(student.parent_id);
  }
  res.json({ success: true });
});

export default router;

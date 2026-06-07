import { Router } from 'express';
import db from '../db';

const router = Router();

// 获取所有教师
router.get('/', (req, res) => {
  const teachers = db.prepare('SELECT * FROM teachers').all();
  res.json(teachers);
});

// 创建教师
router.post('/', (req, res) => {
  const { name, phone, email, subject } = req.body;
  const id = `teacher-${Date.now()}`;
  db.prepare(
    'INSERT INTO teachers (id, name, phone, email, subject) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, phone, email, subject);
  
  // 同时创建用户账号
  const username = `teacher${Date.now()}`;
  db.prepare(
    'INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)'
  ).run(id, username, '123456', 'teacher', name);
  
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
  res.json(teacher);
});

// 更新教师
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, email, subject } = req.body;
  db.prepare(
    'UPDATE teachers SET name = ?, phone = ?, email = ?, subject = ? WHERE id = ?'
  ).run(name, phone, email, subject, id);
  
  // 同时更新用户
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, id);
  
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
  res.json(teacher);
});

// 删除教师
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM teachers WHERE id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;

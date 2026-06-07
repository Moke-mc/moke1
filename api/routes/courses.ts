import { Router } from 'express';
import db from '../db';

const router = Router();

// 获取所有课程
router.get('/', (req, res) => {
  const courses = db.prepare('SELECT * FROM courses').all();
  res.json(courses);
});

// 创建课程
router.post('/', (req, res) => {
  const { name, description, duration } = req.body;
  const id = `course-${Date.now()}`;
  db.prepare(
    'INSERT INTO courses (id, name, description, duration) VALUES (?, ?, ?, ?)'
  ).run(id, name, description, duration);
  
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  res.json(course);
});

// 更新课程
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, duration } = req.body;
  db.prepare(
    'UPDATE courses SET name = ?, description = ?, duration = ? WHERE id = ?'
  ).run(name, description, duration, id);
  
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  res.json(course);
});

// 删除课程
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;

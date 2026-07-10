import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';

const router = Router();

// 获取所有分类
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM course_categories ORDER BY created_at DESC').all();
  res.json(categories);
});

// 创建分类
router.post('/', (req, res) => {
  const { name, description } = req.body;
  const id = `cat-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  db.prepare(
    'INSERT INTO course_categories (id, name, description, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, name, description || null, createdAt);

  const category = db.prepare('SELECT * FROM course_categories WHERE id = ?').get(id);
  res.json(category);
});

// 更新分类
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  db.prepare(
    'UPDATE course_categories SET name = ?, description = ? WHERE id = ?'
  ).run(name, description || null, id);

  const category = db.prepare('SELECT * FROM course_categories WHERE id = ?').get(id);
  res.json(category);
});

// 删除分类
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM course_categories WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;

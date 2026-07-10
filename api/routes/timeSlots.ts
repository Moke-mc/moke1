import { Router } from 'express';
import db from '../db';

const router = Router();

// 获取时间段
// ?categoryId=xxx  → 获取某分类的时间段
// ?all=1           → 获取全部（含通用+各分类）
// 无参数           → 获取总课表通用时段（category_id 为 NULL）
router.get('/', (req, res) => {
  const { categoryId, all } = req.query;

  let query = 'SELECT * FROM time_slots';
  const params: string[] = [];

  if (all === '1') {
    // 全部
  } else if (categoryId) {
    query += ' WHERE category_id = ?';
    params.push(categoryId as string);
  } else {
    // 总课表通用时段
    query += ' WHERE category_id IS NULL';
  }

  query += ' ORDER BY sort_order ASC';
  const slots = db.prepare(query).all(...params);
  res.json(slots);
});

// 创建时间段（需指定 categoryId，传空字符串/null 表示总课表通用时段）
router.post('/', (req, res) => {
  const { startTime, endTime, sortOrder, categoryId } = req.body;
  const id = `slot-${Date.now()}`;
  const order = sortOrder ?? 99;
  // categoryId 为空字符串或 null 时存为 NULL
  const cat = categoryId || null;
  db.prepare(
    'INSERT INTO time_slots (id, start_time, end_time, sort_order, category_id) VALUES (?, ?, ?, ?, ?)'
  ).run(id, startTime, endTime, order, cat);

  const slot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(id);
  res.json(slot);
});

// 更新时间段
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { startTime, endTime, sortOrder, categoryId } = req.body;
  const order = sortOrder ?? 99;
  const cat = categoryId || null;
  db.prepare(
    'UPDATE time_slots SET start_time = ?, end_time = ?, sort_order = ?, category_id = ? WHERE id = ?'
  ).run(startTime, endTime, order, cat, id);

  const slot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(id);
  res.json(slot);
});

// 删除时间段
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM time_slots WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;

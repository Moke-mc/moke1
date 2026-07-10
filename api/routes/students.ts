import { Router } from 'express';
import db from '../db';

const router = Router();

// 获取所有学员
router.get('/', (req, res) => {
  const students = db.prepare(`
    SELECT s.*, p.name as parent_name, u.username as parent_username
    FROM students s 
    JOIN parents p ON s.parent_id = p.id
    LEFT JOIN users u ON s.parent_id = u.id
  `).all();
  res.json(students);
});

// 获取单个学员详情
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const student = db.prepare(`
    SELECT s.*, p.name as parent_name, u.username as parent_username
    FROM students s 
    JOIN parents p ON s.parent_id = p.id
    LEFT JOIN users u ON s.parent_id = u.id
    WHERE s.id = ?
  `).get(id);
  if (!student) {
    return res.status(404).json({ success: false, error: '学员不存在' });
  }
  res.json(student);
});

// 创建学员
router.post('/', (req, res) => {
  const { name, phone, parentName, parentPhone, totalLessons, subject, parentUsername, parentPassword,
    photo, gender, birthDate, school, grade, address, competitionExperiences } = req.body;
  const parentId = `parent-${Date.now()}`;
  const studentId = `student-${Date.now()}`;
  
  // 创建家长
  db.prepare(
    'INSERT INTO parents (id, name, phone) VALUES (?, ?, ?)'
  ).run(parentId, parentName, parentPhone);
  
  // 创建家长用户账号
  const finalUsername = parentUsername || `parent${Date.now()}`;
  const finalPassword = parentPassword || '123456';
  db.prepare(
    'INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)'
  ).run(parentId, finalUsername, finalPassword, 'parent', parentName);
  
  // 创建学员（含档案信息）
  db.prepare(
    `INSERT INTO students (id, name, phone, parent_id, total_lessons, used_lessons, subject, 
     photo, gender, birth_date, school, grade, address, competition_experiences) 
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(studentId, name, phone, parentId, totalLessons, subject || null,
    photo || null, gender || null, birthDate || null, school || null, grade || null, 
    address || null, competitionExperiences ? JSON.stringify(competitionExperiences) : null);
  
  const student = db.prepare(`
    SELECT s.*, p.name as parent_name, u.username as parent_username
    FROM students s 
    JOIN parents p ON s.parent_id = p.id
    LEFT JOIN users u ON s.parent_id = u.id
    WHERE s.id = ?
  `).get(studentId);
  res.json(student);
});

// 更新学员
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, totalLessons, subject, parentUsername,
    photo, gender, birthDate, school, grade, address, competitionExperiences } = req.body;
  
  db.prepare(
    `UPDATE students SET name = ?, phone = ?, total_lessons = ?, subject = ?, 
     photo = ?, gender = ?, birth_date = ?, school = ?, grade = ?, address = ?, 
     competition_experiences = ? WHERE id = ?`
  ).run(name, phone, totalLessons, subject || null,
    photo !== undefined ? photo : null, 
    gender !== undefined ? gender : null, 
    birthDate !== undefined ? birthDate : null, 
    school !== undefined ? school : null, 
    grade !== undefined ? grade : null, 
    address !== undefined ? address : null,
    competitionExperiences !== undefined ? JSON.stringify(competitionExperiences) : null,
    id);

  // 同步更新 users 表的 username（家长账号）
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
  if (student && parentUsername) {
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(parentUsername, student.parent_id);
  }
  
  const updated = db.prepare(`
    SELECT s.*, p.name as parent_name, u.username as parent_username
    FROM students s 
    JOIN parents p ON s.parent_id = p.id
    LEFT JOIN users u ON s.parent_id = u.id
    WHERE s.id = ?
  `).get(id);
  res.json(updated);
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

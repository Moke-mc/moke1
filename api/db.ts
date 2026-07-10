import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 创建表
const initDb = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `);

  // Teachers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      subject TEXT NOT NULL
    )
  `);

  // Parents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS parents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL
    )
  `);

  // Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      total_lessons INTEGER NOT NULL DEFAULT 0,
      used_lessons INTEGER NOT NULL DEFAULT 0,
      subject TEXT
    )
  `);

  // 添加 subject 列（如果不存在）
  try {
    db.exec('ALTER TABLE students ADD COLUMN subject TEXT');
  } catch (err) {
    // 列已存在，忽略错误
  }

  // 添加学生档案字段（照片、个人信息、比赛经历）
  try { db.exec('ALTER TABLE students ADD COLUMN photo TEXT'); } catch (err) {}
  try { db.exec('ALTER TABLE students ADD COLUMN gender TEXT'); } catch (err) {}
  try { db.exec('ALTER TABLE students ADD COLUMN birth_date TEXT'); } catch (err) {}
  try { db.exec('ALTER TABLE students ADD COLUMN school TEXT'); } catch (err) {}
  try { db.exec('ALTER TABLE students ADD COLUMN grade TEXT'); } catch (err) {}
  try { db.exec('ALTER TABLE students ADD COLUMN address TEXT'); } catch (err) {}
  try { db.exec('ALTER TABLE students ADD COLUMN competition_experiences TEXT'); } catch (err) {}

  // Courses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL
    )
  `);

  // 课程分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS course_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Schedule table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled'
    )
  `);

  // 给 schedules 表添加 category_id 列（如果不存在）
  try {
    db.exec('ALTER TABLE schedules ADD COLUMN category_id TEXT');
  } catch (err) {
    // 列已存在，忽略错误
  }

  // 申请上课表（家长端申请审核）
  db.exec(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      schedule_id TEXT,
      course_id TEXT,
      teacher_id TEXT,
      date TEXT,
      time TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      parent_id TEXT,
      message TEXT,
      created_at TEXT NOT NULL,
      reviewed_by TEXT,
      reviewed_at TEXT
    )
  `);

  // 时间段管理表（管理员自定义课表时间线）
  db.exec(`
    CREATE TABLE IF NOT EXISTS time_slots (
      id TEXT PRIMARY KEY,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      category_id TEXT
    )
  `);

  // 给 time_slots 表添加 category_id 列（如果不存在，用于旧表升级）
  try {
    db.exec('ALTER TABLE time_slots ADD COLUMN category_id TEXT');
  } catch (err) {
    // 列已存在，忽略错误
  }

  // Lesson records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_records (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      date TEXT NOT NULL,
      comment TEXT
    )
  `);

  // 插入初始数据
  const userExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE id = ?').get('admin-001') as any;
  if (userExists.count === 0) {
    // Insert admin user
    db.prepare(`
      INSERT INTO users (id, username, password, role, name) VALUES 
      ('admin-001', 'admin', 'admin123', 'admin', '系统管理员')
    `).run();

    // Insert sample teacher
    db.prepare(`
      INSERT INTO teachers (id, name, phone, email, subject) VALUES 
      ('teacher-001', '张老师', '13800138001', 'zhang@example.com', '数学')
    `).run();

    db.prepare(`
      INSERT INTO users (id, username, password, role, name) VALUES 
      ('teacher-001', 'teacher1', 'teacher123', 'teacher', '张老师')
    `).run();

    // Insert sample parent
    db.prepare(`
      INSERT INTO parents (id, name, phone) VALUES 
      ('parent-001', '李爸爸', '13900139001')
    `).run();

    db.prepare(`
      INSERT INTO users (id, username, password, role, name) VALUES 
      ('parent-001', 'parent1', 'parent123', 'parent', '李爸爸')
    `).run();

    // Insert sample student
    db.prepare(`
      INSERT INTO students (id, name, phone, parent_id, total_lessons, used_lessons, subject) VALUES 
      ('student-001', '小明', '13700137001', 'parent-001', 20, 5, '数学')
    `).run();

    // Insert sample course
    db.prepare(`
      INSERT INTO courses (id, name, description, duration) VALUES 
      ('course-001', '数学基础班', '初中数学基础课程', 60)
    `).run();

    // Insert sample categories
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO course_categories (id, name, description, created_at) VALUES 
      ('cat-001', '穿越机班', '穿越机相关课程分类', ?),
      ('cat-002', '基础班', '基础课程分类', ?),
      ('cat-003', '编程班', '编程相关课程分类', ?)
    `).run(now, now, now);

    // Insert sample schedule
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO schedules (id, teacher_id, student_id, course_id, date, time, status, category_id) VALUES 
      ('schedule-001', 'teacher-001', 'student-001', 'course-001', ?, '10:00', 'scheduled', 'cat-002')
    `).run(today);

    // Insert default time slots — 总课表通用时段（category_id 为 NULL）
    db.prepare(`
      INSERT INTO time_slots (id, start_time, end_time, sort_order, category_id) VALUES 
      ('slot-1', '09:00', '10:30', 1, NULL),
      ('slot-2', '10:30', '12:00', 2, NULL),
      ('slot-3', '14:00', '15:30', 3, NULL),
      ('slot-4', '15:30', '17:00', 4, NULL),
      ('slot-5', '17:00', '18:30', 5, NULL),
      ('slot-6', '18:30', '20:00', 6, NULL)
    `).run();

    // 穿越机班 独立时段
    db.prepare(`
      INSERT INTO time_slots (id, start_time, end_time, sort_order, category_id) VALUES 
      ('slot-cat001-1', '09:00', '10:30', 1, 'cat-001'),
      ('slot-cat001-2', '14:00', '15:30', 2, 'cat-001')
    `).run();

    // 基础班 独立时段
    db.prepare(`
      INSERT INTO time_slots (id, start_time, end_time, sort_order, category_id) VALUES 
      ('slot-cat002-1', '10:30', '12:00', 1, 'cat-002'),
      ('slot-cat002-2', '15:30', '17:00', 2, 'cat-002'),
      ('slot-cat002-3', '18:30', '20:00', 3, 'cat-002')
    `).run();

    // 编程班 独立时段
    db.prepare(`
      INSERT INTO time_slots (id, start_time, end_time, sort_order, category_id) VALUES 
      ('slot-cat003-1', '09:00', '10:30', 1, 'cat-003'),
      ('slot-cat003-2', '17:00', '18:30', 2, 'cat-003')
    `).run();
  }
};

initDb();

export default db;

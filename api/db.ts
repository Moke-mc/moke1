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

  // Courses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL
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

    // Insert sample schedule
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO schedules (id, teacher_id, student_id, course_id, date, time, status) VALUES 
      ('schedule-001', 'teacher-001', 'student-001', 'course-001', ?, '10:00', 'scheduled')
    `).run(today);
  }
};

initDb();

export default db;

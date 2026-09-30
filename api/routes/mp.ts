import { Router } from 'express';
import db from '../db';

const router = Router();

// 生成简单 token（生产环境建议换 JWT）
const genToken = (userId: string) => `${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

/**
 * 微信小程序登录
 * 前端调用 wx.login 拿到 code，传给此接口
 * 后端用 code 调用微信 code2session 接口换取 openid
 * 没有配置 AppID 时回退为开发模式（用 code 当临时 openid）
 */
router.post('/wx-login', async (req, res) => {
  const { code, nickName, avatarUrl } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: '缺少 code' });
  }

  const appid = process.env.WX_APPID;
  const secret = process.env.WX_SECRET;

  let openid: string;

  if (appid && secret) {
    // 正式环境：调用微信接口换取 openid
    try {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
      const resp = await fetch(url);
      const data: any = await resp.json();
      if (data.errcode) {
        return res.status(400).json({ success: false, message: `微信登录失败: ${data.errmsg}` });
      }
      openid = data.openid;
    } catch (err: any) {
      return res.status(500).json({ success: false, message: `调用微信接口失败: ${err.message}` });
    }
  } else {
    // 开发模式：用 code 作为临时 openid（仅供未配置 AppID 时本地测试）
    openid = `dev_${code}`;
  }

  // 查找家长
  let parent = db.prepare('SELECT * FROM parents WHERE openid = ?').get(openid) as any;

  if (!parent) {
    // 自动创建家长记录（未绑定学生）
    const parentId = `parent-${Date.now()}`;
    db.prepare(
      'INSERT INTO parents (id, name, phone, openid, avatar, wx_nickname) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(parentId, nickName || '微信用户', '', openid, avatarUrl || null, nickName || null);
    // 创建 users 记录（便于权限统一）
    db.prepare(
      'INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)'
    ).run(parentId, `wx_${openid.slice(-8)}`, openid, 'parent', nickName || '微信用户');
    parent = db.prepare('SELECT * FROM parents WHERE id = ?').get(parentId) as any;
  } else if (nickName || avatarUrl) {
    // 已存在则更新昵称和头像
    db.prepare('UPDATE parents SET avatar = COALESCE(?, avatar), wx_nickname = COALESCE(?, wx_nickname) WHERE id = ?')
      .run(avatarUrl || null, nickName || null, parent.id);
  }

  res.json({
    success: true,
    token: genToken(parent.id),
    user: {
      id: parent.id,
      role: 'parent',
      name: parent.wx_nickname || parent.name,
      avatar: parent.avatar,
      openid: parent.openid,
    },
  });
});

/**
 * 家长通过学生手机号绑定学生
 * 一个家长可绑定多个学生（建议 1-2 个）
 */
router.post('/bind-student', (req, res) => {
  const { parentId, studentPhone, studentName } = req.body;
  if (!parentId || !studentPhone) {
    return res.status(400).json({ success: false, message: '缺少参数' });
  }

  // 校验家长
  const parent = db.prepare('SELECT * FROM parents WHERE id = ?').get(parentId) as any;
  if (!parent) {
    return res.status(404).json({ success: false, message: '家长不存在' });
  }

  // 通过手机号查找学生
  let student = db.prepare('SELECT * FROM students WHERE phone = ?').get(studentPhone) as any;
  if (!student && studentName) {
    student = db.prepare('SELECT * FROM students WHERE name = ? AND phone = ?').get(studentName, studentPhone) as any;
  }
  if (!student) {
    return res.status(404).json({ success: false, message: '未找到对应学生，请确认手机号' });
  }

  // 已经绑定到其他家长
  if (student.parent_id && student.parent_id !== parentId) {
    // 把原家长解绑，绑定到当前家长
    db.prepare('UPDATE students SET parent_id = ? WHERE id = ?').run(parentId, student.id);
  } else if (student.parent_id === parentId) {
    // 已经绑定
    return res.json({ success: true, message: '已绑定该学生', student });
  } else {
    db.prepare('UPDATE students SET parent_id = ? WHERE id = ?').run(parentId, student.id);
  }

  const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(student.id) as any;
  res.json({ success: true, student: updated });
});

/**
 * 解绑学生
 */
router.post('/unbind-student', (req, res) => {
  const { parentId, studentId } = req.body;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!student) {
    return res.status(404).json({ success: false, message: '学生不存在' });
  }
  if (student.parent_id !== parentId) {
    return res.status(403).json({ success: false, message: '该学生未绑定到当前家长' });
  }
  // 重置 parent_id 为空字符串，避免外键约束问题
  db.prepare("UPDATE students SET parent_id = '' WHERE id = ?").run(studentId);
  res.json({ success: true });
});

/**
 * 获取家长绑定的所有学生
 */
router.get('/my-students', (req, res) => {
  const { parentId } = req.query as any;
  if (!parentId) {
    return res.status(400).json({ success: false, message: '缺少 parentId' });
  }
  const students = db.prepare(`
    SELECT s.*, p.name as parent_name
    FROM students s
    LEFT JOIN parents p ON s.parent_id = p.id
    WHERE s.parent_id = ?
    ORDER BY s.name
  `).all(parentId);
  res.json(students);
});

export default router;

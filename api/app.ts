/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import teachersRoutes from './routes/teachers.js'
import studentsRoutes from './routes/students.js'
import coursesRoutes from './routes/courses.js'
import schedulesRoutes from './routes/schedules.js'
import lessonsRoutes from './routes/lessons.js'
import categoriesRoutes from './routes/categories.js'
import enrollmentsRoutes from './routes/enrollments.js'
import timeSlotsRoutes from './routes/timeSlots.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean)

/**
 * 生产环境：提供前端静态文件
 */
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

app.use(
  cors({
    origin: (origin: string | undefined, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/teachers', teachersRoutes)
app.use('/api/students', studentsRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/schedules', schedulesRoutes)
app.use('/api/lessons', lessonsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/enrollments', enrollmentsRoutes)
app.use('/api/time-slots', timeSlotsRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error]', error.message, error.stack)
  if (req.path.startsWith('/api/')) {
    res.status(500).json({
      success: false,
      error: 'Server internal error',
    })
  } else {
    next()
  }
})

/**
 * 404 handler — 非API请求回退到前端index.html（支持前端路由）
 */
app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      error: 'API not found',
    })
  } else {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

export default app

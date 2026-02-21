import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { signIn, signUp } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (isLogin) {
      const { error } = await signIn(email, password)
      if (error) setError(error)
      else navigate('/')
    } else {
      if (!nickname.trim()) { setError('请输入昵称'); setLoading(false); return }
      const { error } = await signUp(email, password, nickname)
      if (error) setError(error)
      else setSuccess('注册成功！请查收验证邮件后登录。')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">807</span>
          </div>
          <h1 className="text-2xl font-bold text-text">听力词汇练习</h1>
          <p className="text-sm text-text-secondary mt-1">王陆807第二版</p>
        </div>

        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex bg-surface-alt rounded-xl p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccess('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-primary text-white shadow-md' : 'text-text-secondary'}`}
            >
              登录
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccess('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-primary text-white shadow-md' : 'text-text-secondary'}`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="昵称"
                  className="w-full pl-10 pr-4 py-3 bg-surface-alt rounded-xl text-text text-sm outline-none border border-transparent focus:border-primary transition-colors"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="邮箱"
                required
                className="w-full pl-10 pr-4 py-3 bg-surface-alt rounded-xl text-text text-sm outline-none border border-transparent focus:border-primary transition-colors"
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="密码（至少6位）"
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-3 bg-surface-alt rounded-xl text-text text-sm outline-none border border-transparent focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="text-error text-sm text-center">{error}</p>}
            {success && <p className="text-success text-sm text-center">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
            >
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

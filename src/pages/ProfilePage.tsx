import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, LogOut, Shield, Save, User } from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'
import { supabase } from '../lib/supabase'
import { useProgressStore } from '../stores/useProgressStore'
export default function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuthStore()
  const { getMasteredCount, getTotalPracticedCount } = useProgressStore()

  const [nickname, setNickname] = useState(profile?.nickname || '')
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const mastered = getMasteredCount()
  const practiced = getTotalPracticedCount()

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await updateProfile({ nickname, is_public: isPublic })
    setMessage(error || '保存成功')
    setSaving(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setMessage('上传失败: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    await updateProfile({ avatar_url: data.publicUrl + '?t=' + Date.now() })
    setUploading(false)
    setMessage('头像已更新')
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text">个人资料</h1>

      {/* Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl p-6 border border-border flex flex-col items-center"
      >
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-primary" />
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors"
          >
            <Camera size={14} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <p className="text-sm text-text-secondary">{user?.email}</p>
        {uploading && <p className="text-xs text-primary mt-2">上传中...</p>}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="bg-surface rounded-2xl p-4 border border-border text-center">
          <div className="text-2xl font-bold text-primary">{mastered}</div>
          <div className="text-xs text-text-tertiary mt-1">已掌握</div>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-border text-center">
          <div className="text-2xl font-bold text-success">{practiced}</div>
          <div className="text-xs text-text-tertiary mt-1">已练习</div>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-border text-center">
          <div className="text-2xl font-bold text-warning">{profile?.streak_days || 0}</div>
          <div className="text-xs text-text-tertiary mt-1">连续打卡</div>
        </div>
      </motion.div>

      {/* Edit form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface rounded-2xl border border-border divide-y divide-border"
      >
        <div className="p-5">
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
            <User size={16} className="text-primary" /> 昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-alt rounded-xl text-text text-sm outline-none border border-transparent focus:border-primary transition-colors"
          />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-text">
              <Shield size={16} className="text-primary" /> 公开排行榜数据
            </label>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`w-12 h-7 rounded-full transition-colors ${isPublic ? 'bg-primary' : 'bg-border'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-1 ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <p className="text-xs text-text-tertiary mt-1">关闭后，你的数据不会出现在排行榜中</p>
        </div>

        <div className="p-5">
          {message && (
            <p className={`text-sm mb-3 ${message.includes('成功') || message.includes('更新') ? 'text-success' : 'text-error'}`}>
              {message}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            <Save size={16} /> {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </motion.div>

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-3 bg-surface border border-border text-error rounded-2xl font-medium hover:bg-error/5 transition-colors"
      >
        <LogOut size={16} /> 退出登录
      </button>
    </div>
  )
}

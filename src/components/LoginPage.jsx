import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email ou mot de passe incorrect')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src="/logo-grunfalcot.png" alt="Grün Falcot & Co." className="h-14 w-auto object-contain" />
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-6 py-8">
          <h1 className="text-base font-semibold text-stone-800 mb-6 text-center">Connexion</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 focus:border-[#c5a059]"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-sm font-medium text-white bg-[#c5a059] hover:bg-[#1e3349] transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

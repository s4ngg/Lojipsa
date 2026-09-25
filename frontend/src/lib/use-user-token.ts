'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const STORAGE_KEY = 'lojipsa-user-token'

/**
 * 디스코드 로그인 토큰을 관리하는 공용 훅. ?token=이나 ?error=login_failed 쿼리를
 * 한 번만 처리해서 localStorage에 반영하고, 이후에는 localStorage 값을 쓴다.
 * /my, /my/weekly-gold 등 로그인이 필요한 페이지에서 공통으로 쓴다.
 */
export function useUserToken() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    const urlToken = searchParams.get('token')
    const urlError = searchParams.get('error')

    if (urlToken) {
      localStorage.setItem(STORAGE_KEY, urlToken)
      setToken(urlToken)
      router.replace(pathname)
    } else if (urlError === 'login_failed') {
      setLoginError('디스코드 로그인에 실패했습니다. 다시 시도해주세요.')
      router.replace(pathname)
    } else {
      setToken(localStorage.getItem(STORAGE_KEY))
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function clearToken(message: string) {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setLoginError(message)
  }

  return { token, ready, loginError, clearToken }
}

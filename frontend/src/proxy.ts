import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 로컬 개발 편의를 위해 이 호스트들에서는 /admin을 그대로 열어준다.
// 배포 후에는 admin.<도메인>으로만 열리고, 일반 도메인에서는 /admin이 404로 막힌다.
const DEV_HOSTS = ['localhost:3000', '127.0.0.1:3000']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const host = request.headers.get('host') ?? ''
  const isAdminHost = host.startsWith('admin.') || DEV_HOSTS.includes(host)

  if (!isAdminHost) {
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

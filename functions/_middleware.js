export async function onRequest({ request, next, env }) {
  const USERNAME = env.AUTH_USER ?? 'admin'
  const PASSWORD = env.AUTH_PASS ?? 'SideskaperAdmin'

  const authHeader = request.headers.get('Authorization') ?? ''

  if (!authHeader.startsWith('Basic ')) {
    return unauthorized()
  }

  let decoded
  try {
    decoded = atob(authHeader.slice(6))
  } catch {
    return unauthorized()
  }

  const colonIdx = decoded.indexOf(':')
  if (colonIdx === -1) return unauthorized()

  const user = decoded.slice(0, colonIdx)
  const pass = decoded.slice(colonIdx + 1)

  if (user !== USERNAME || pass !== PASSWORD) {
    return unauthorized()
  }

  return next()
}

function unauthorized() {
  return new Response('Innlogging kreves', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="CRM Caller", charset="UTF-8"' },
  })
}

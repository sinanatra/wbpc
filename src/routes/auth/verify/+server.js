import { json } from '@sveltejs/kit';
import { SITE_PASSWORD } from '$env/static/private';

export async function POST({ request, cookies }) {
  const { password } = await request.json();

  if (password === SITE_PASSWORD) {
    cookies.set('site_password', password, {
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    return json({ success: true });
  }

  return json({ success: false }, { status: 401 });
}

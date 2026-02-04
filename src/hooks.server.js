import { redirect } from '@sveltejs/kit';
import { SITE_PASSWORD } from '$env/static/private';

export async function handle({ event, resolve }) {
  const sessionPassword = event.cookies.get('site_password');
  
  if (event.url.pathname === '/auth' || event.url.pathname.startsWith('/auth/')) {
    return resolve(event);
  }
  if (sessionPassword !== SITE_PASSWORD) {
    throw redirect(302, '/auth');
  }

  return resolve(event);
}

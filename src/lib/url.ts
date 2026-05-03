export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://quiltcorgi.com' : 'http://localhost:3000')
  );
}

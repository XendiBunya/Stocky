export const dynamic = 'force-static';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

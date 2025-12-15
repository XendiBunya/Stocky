export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://stocky-inxt2w2s3-uday-banerjees-projects.vercel.app/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

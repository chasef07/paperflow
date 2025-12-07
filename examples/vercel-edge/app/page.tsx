export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        PaperSend - Vercel Edge Demo
      </h1>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        This demo shows PaperSend generating PDFs on Vercel&apos;s Edge Runtime.
      </p>
      <a
        href="/api/pdf"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '0.5rem',
        }}
      >
        Generate Invoice PDF
      </a>
      <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#999' }}>
        Or try: <code>/api/pdf?invoice=INV-2024-042</code>
      </p>
    </main>
  );
}

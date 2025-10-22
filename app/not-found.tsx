import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      padding: '2rem',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#64748b',
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#1e293b',
        }}>
          Sayfa Bulunamadı
        </h2>
        <p style={{
          color: '#64748b',
          marginBottom: '1.5rem',
        }}>
          Aradığınız sayfa mevcut değil. Lütfen ana sayfaya dönün.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: '500',
          }}
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}

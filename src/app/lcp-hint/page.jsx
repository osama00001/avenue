export const metadata = {
  title: 'eBook Passphrase Help | Avenue Bookstore',
  description: 'Help recovering your eBook passphrase for Readium LCP protected titles.',
};

export default function LcpHintPage() {
  return (
    <main style={{
      fontFamily: 'Georgia, serif',
      maxWidth: '640px',
      margin: '80px auto',
      padding: '0 24px',
      color: '#1a1a1a',
      lineHeight: '1.7',
    }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: '600', marginBottom: '8px' }}>
        eBook Passphrase Help
      </h1>

      <p style={{ color: '#555', marginBottom: '32px', fontSize: '0.95rem' }}>
        Avenue Bookstore · Readium LCP Protected Content
      </p>

      <p>
        If your eReader is asking for a <strong>passphrase</strong> to open a
        protected eBook you purchased from Avenue Bookstore, your passphrase is:
      </p>

      <div style={{
        background: '#f5f5f0',
        border: '1px solid #ddd',
        borderLeft: '4px solid #2c5f2e',
        borderRadius: '4px',
        padding: '16px 20px',
        margin: '24px 0',
        fontSize: '1rem',
      }}>
        <strong>The email address you used to register your Avenue Bookstore account.</strong>
      </div>

      <p>
        Enter your email address exactly as it appears in your account — including
        the correct capitalisation and any dots or hyphens.
      </p>

      <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '40px', marginBottom: '12px' }}>
        Still having trouble?
      </h2>

      <ul style={{ paddingLeft: '20px' }}>
        <li style={{ marginBottom: '8px' }}>
          Make sure you&rsquo;re entering the email address associated with your
          Avenue Bookstore account, not a different address.
        </li>
        <li style={{ marginBottom: '8px' }}>
          Check that your eReader app supports Readium LCP. If you&rsquo;re unsure,
          <a href="https://www.edrlab.org/readium-lcp/certified-apps-ready-for-lcp/"
             target="_blank"
             rel="noopener noreferrer"
             style={{ color: '#2c5f2e' }}>
            &nbsp;see the list of compatible apps
          </a>.
        </li>
        <li>
          Contact us at{' '}
          <a href="mailto:hello@avenuebookstore.com" style={{ color: '#2c5f2e' }}>
            hello@avenuebookstore.com
          </a>{' '}
          and we&rsquo;ll help you access your purchase.
        </li>
      </ul>

      <p style={{ marginTop: '48px', fontSize: '0.85rem', color: '#888' }}>
        Avenue Bookstore &mdash; avenuebookstore.com
      </p>
    </main>
  );
}

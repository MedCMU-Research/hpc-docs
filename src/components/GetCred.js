import React, { useState } from 'react';

export default function EmailAccessPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setEmail(event.target.value);
    setSubmitted(false);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setCredentials(null);
    setSubmitted(false);

    try {
      const response = await fetch(`http://10.128.1.10:3333/get_login/${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch credentials. Please check your email and try again.');
      }
      
      const data = await response.json();
      if (data.username && data.password) {
        setCredentials(data);
        setSubmitted(true);
      } else {
        throw new Error('Invalid data format received from the server.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
      <div className="row">
        <div className="col col--10 col--offset-1">
          <div className="card shadow--lw" style={{ border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div className="card__header text--center" style={{ paddingBottom: 0 }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Guest Access Portal</h3>
              <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>
                Retrieve your temporary login credentials for the HPC Workshop.
              </p>
            </div>
            <div className="card__body" style={{ padding: '2rem' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="emailInput" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Registered Email Address <span style={{ color: 'var(--ifm-color-danger)' }}>*</span>
                  </label>
                  <input
                    id="emailInput"
                    type="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="e.g., guest@example.com"
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 1rem', 
                      fontSize: '1rem', 
                      borderRadius: 'var(--ifm-global-radius)',
                      border: '1px solid var(--ifm-color-emphasis-400)',
                      backgroundColor: 'var(--ifm-background-surface-color)',
                      color: 'var(--ifm-font-color-base)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                {error && (
                  <div className="alert alert--danger" role="alert" style={{ marginBottom: '1.5rem' }}>
                    {error}
                  </div>
                )}
                <button 
                  type="submit" 
                  className="button button--primary button--block"
                  style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: 'bold' }}
                  disabled={loading}
                >
                  {loading ? 'Fetching Credentials...' : 'Get Login Credential'}
                </button>
              </form>
            </div>
            {submitted && credentials && (
              <div className="card__footer" style={{ borderTop: '1px solid var(--ifm-color-emphasis-200)', padding: '1.5rem' }}>
                <div className="alert alert--success" role="alert" style={{ marginBottom: 0 }}>
                  <h4 style={{ margin: 0, marginBottom: '1rem', color: 'var(--ifm-alert-color)', textAlign: 'center' }}>
                    Access Ready!
                  </h4>
                  <div style={{ 
                    backgroundColor: 'var(--ifm-color-emphasis-100)', 
                    padding: '1.5rem', 
                    borderRadius: 'var(--ifm-global-radius)', 
                    fontFamily: 'monospace', 
                    fontSize: '1.1rem',
                    color: 'var(--ifm-font-color-base)'
                  }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                      <strong style={{ width: '100px', display: 'inline-block' }}>Username:</strong> 
                      <code style={{ fontSize: '1.1rem', padding: '0.3rem 0.6rem' }}>{credentials.username}</code>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <strong style={{ width: '100px', display: 'inline-block' }}>Password:</strong> 
                      <code style={{ fontSize: '1.1rem', padding: '0.3rem 0.6rem' }}>{credentials.password}</code>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.95rem', marginTop: '1rem', marginBottom: 0, textAlign: 'center' }}>
                    Please use these credentials to connect to the HPC workshop environments.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

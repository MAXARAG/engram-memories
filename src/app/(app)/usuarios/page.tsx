"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function UsuariosPage() {
  const { user, session, isLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("usuario");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = 'ezpeleta.juan@gmail.com';

  useEffect(() => {
    if (!user) return;
    if (user.email !== ADMIN_EMAIL) return;
    loadUsers();
    loadLogs();
  }, [user]);

  async function loadUsers() {
    setLoading(true);
    const token = session?.access_token;
    try {
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data.users || []);
    } finally { setLoading(false); }
  }

  async function loadLogs() {
    const token = session?.access_token;
    const res = await fetch('/api/admin/audit', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setLogs(data.logs || []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return alert('Email y password son requeridos');
    const token = session?.access_token;
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email, password, role }) });
    const data = await res.json();
    if (data.error) return alert(data.error);
    setEmail(''); setPassword(''); setRole('usuario');
    loadUsers(); loadLogs();
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar usuario?')) return;
    const token = session?.access_token;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.error) return alert(data.error);
    loadUsers(); loadLogs();
  }

  if (isLoading) return <div>...</div>;
  if (!user || user.email !== ADMIN_EMAIL) return <div>No autorizado</div>;

  return (
    <div className="module-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">Gestioná cuentas de acceso y revisá auditoría</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
        <div>
          <div className="card">
            <h3 style={{ marginBottom: '0.5rem' }}>Usuarios registrados</h3>
            {loading ? <p>Cargando...</p> : (
              <div>
                {users.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.email}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{u.id}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost" onClick={() => handleDelete(u.id)}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>Actividad reciente (auditoría)</h3>
            <div style={{ maxHeight: 300, overflow: 'auto', marginTop: '0.5rem' }}>
              {logs.map(l => (
                <div key={l.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{l.action}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{l.description}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(l.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside>
          <div className="card">
            <h3>Crear usuario</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input className="input" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="input" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="usuario">Usuario</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn btn-primary" type="submit">Crear</button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

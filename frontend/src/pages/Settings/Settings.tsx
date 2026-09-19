import { Users, Smartphone, Activity, List, Globe, Search, Plus, ShieldCheck, Download, Phone, Settings as SettingsIcon } from 'lucide-react';

const tabs = [
  { label: 'Users', icon: Users },
  { label: 'SMS Gateway', icon: Smartphone },
  { label: 'Thresholds', icon: Activity },
  { label: 'Audit Log', icon: List },
  { label: 'Localization', icon: Globe },
];

export default function Settings() {
  const users = [
    { name: 'Jean-Pierre Kabera', role: 'Ministry', district: 'National', status: 'Active', lastActive: '2 mins ago' },
    { name: 'Marie Claire Uwase', role: 'District Officer', district: 'Musanze', status: 'Active', lastActive: '1 hour ago' },
    { name: 'Emmanuel Gisa', role: 'CHW', district: 'Kayonza', status: 'Inactive', lastActive: '2 days ago' },
    { name: 'Sonia Mukamanzi', role: 'Admin', district: 'Kigali', status: 'Active', lastActive: 'Just now' },
    { name: 'Aimable Rugamba', role: 'District Officer', district: 'Nyamagabe', status: 'Active', lastActive: '5 hours ago' },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><SettingsIcon size={14} /> System Administration / Users</h2>
        <h1 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>Settings &amp; Admin</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Manage platform security, technical integrations, and AI risk logic.</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-xl)' }}>
         {tabs.map(({ label, icon: Icon }, i) => (
            <button
               key={label}
               style={{
                  padding: 'var(--spacing-md) var(--spacing-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderBottom: i === 0 ? '2px solid var(--color-primary)' : '2px solid transparent',
                  fontWeight: i === 0 ? 600 : 400,
                  color: i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
               }}
            >
               <Icon size={16} /> {label}
            </button>
         ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--spacing-2xl)' }}>
         <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-sm) var(--spacing-md)', width: '300px' }}>
               <Search size={16} color="var(--color-text-secondary)" />
               <input type="text" placeholder="Search users by name or district..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0 var(--spacing-sm)', fontSize: '0.875rem' }} />
            </div>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={16} /> Add User</button>
         </div>

         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
               <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>User</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>District</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Last Active</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
               </tr>
            </thead>
            <tbody>
               {users.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 500, fontSize: '0.875rem' }}>{u.name}</td>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}><span className="badge" style={{ backgroundColor: '#F3F4F6', fontWeight: 500, textTransform: 'none' }}>{u.role}</span></td>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{u.district}</td>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: '0.875rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: u.status === 'Active' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                           <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: u.status === 'Active' ? 'var(--color-risk-low)' : 'var(--color-text-tertiary)' }}></span>
                           {u.status}
                        </span>
                     </td>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{u.lastActive}</td>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'right' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Edit</button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
         <div style={{ display: 'flex', gap: 'var(--spacing-lg)', maxWidth: '600px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <ShieldCheck size={24} color="var(--color-text-secondary)" />
            </div>
            <div>
               <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>System Health &amp; Compliance</h3>
               <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Zero Bite complies with Rwanda MoH data privacy standards. All administrative changes are logged for seasonal review.</p>
            </div>
         </div>
         <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white' }}><Download size={16} /> Download Security Report</button>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white' }}><Phone size={16} /> Contact System Support</button>
         </div>
      </div>
    </div>
  );
}

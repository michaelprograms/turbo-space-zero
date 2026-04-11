function OpenLoadDemo({ theme }) {
  const bg = theme?.backgroundColor || '#141428';
  const panel = theme?.panelBackground || '#1a1a2e';
  const text = theme?.textColor || '#eee';
  const border = theme?.borderColor || '#333';
  const accent = theme?.accentColor || '#106ba3';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, fontFamily:'monospace', fontSize:11 }}>
      <div style={{ background: bg, border:`1px solid ${border}`, borderRadius:8, padding:16, width:220 }}>
        <div style={{ color: text, fontWeight:'bold', fontSize:12, marginBottom:10 }}>Open Map</div>
        {['Forest Zone, 25×25','Cave System, 15×10','Town Map, 20×20'].map((name, i) => (
          <div key={name} style={{ padding:'8px 10px', borderRadius:5, border:`1px solid ${border}`, background: i===0 ? accent : panel, color: i===0 ? '#fff' : text, marginBottom:6, fontSize:10, cursor:'pointer' }}>{name}</div>
        ))}
      </div>
      <div style={{ color: theme?.textSecondary || '#888', fontSize:10 }}>Click a map to load it</div>
    </div>
  );
}
export default OpenLoadDemo;

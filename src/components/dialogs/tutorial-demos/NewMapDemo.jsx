function NewMapDemo({ theme }) {
  const bg = theme?.panelBackground || '#1a1a2e';
  const text = theme?.textColor || '#eee';
  const accent = theme?.accentColor || '#106ba3';
  const border = theme?.borderColor || '#333';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, fontFamily:'monospace', fontSize:11 }}>
      <div style={{ background: bg, border:`1px solid ${border}`, borderRadius:6, padding:'8px 0', width:160 }}>
        <div style={{ padding:'4px 12px', color: text, fontSize:10, fontWeight:'bold', borderBottom:`1px solid ${border}`, marginBottom:4 }}>File</div>
        <div style={{ padding:'6px 12px', background: accent, color:'#fff', fontSize:10 }}>New</div>
        <div style={{ padding:'6px 12px', color: text, fontSize:10 }}>Open</div>
        <div style={{ padding:'6px 12px', color: text, fontSize:10 }}>Save</div>
        <div style={{ padding:'6px 12px', color: text, fontSize:10 }}>Import</div>
        <div style={{ padding:'6px 12px', color: text, fontSize:10 }}>Export</div>
      </div>
      <div style={{ color: theme?.textSecondary || '#888', fontSize:10 }}>File → New creates a blank 25×25 map</div>
    </div>
  );
}
export default NewMapDemo;

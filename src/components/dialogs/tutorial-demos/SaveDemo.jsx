function SaveDemo({ theme }) {
  const bg = theme?.panelBackground || '#1a1a2e';
  const text = theme?.textColor || '#eee';
  const accent = theme?.accentColor || '#106ba3';
  const border = theme?.borderColor || '#333';
  const secondary = theme?.textSecondary || '#888';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16, fontFamily:'monospace', fontSize:11 }}>
      <div style={{ display:'flex', gap:20, alignItems:'center' }}>
        <div style={{ background: bg, border:`1px solid ${border}`, borderRadius:6, padding:'8px 0', width:130 }}>
          <div style={{ padding:'4px 12px', color: text, fontSize:10, fontWeight:'bold', borderBottom:`1px solid ${border}`, marginBottom:4 }}>File</div>
          <div style={{ padding:'6px 12px', color: text, fontSize:10 }}>New</div>
          <div style={{ padding:'6px 12px', color: text, fontSize:10 }}>Open</div>
          <div style={{ padding:'6px 12px', background: accent, color:'#fff', fontSize:10 }}>Save</div>
        </div>
        <div style={{ color: secondary, fontSize:10, textAlign:'center' }}>or press<br/><kbd style={{ background: bg, border:`1px solid ${border}`, padding:'2px 6px', borderRadius:3, color: text, fontSize:11 }}>S</kbd></div>
      </div>
      <div style={{ color: secondary, fontSize:10 }}>Map is stored locally in your browser (IndexedDB)</div>
    </div>
  );
}
export default SaveDemo;

function ImportExportDemo({ theme }) {
  const bg = theme?.panelBackground || '#1a1a2e';
  const text = theme?.textColor || '#eee';
  const accent = theme?.accentColor || '#106ba3';
  const border = theme?.borderColor || '#333';
  const secondary = theme?.textSecondary || '#888';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16, fontFamily:'monospace', fontSize:11 }}>
      <div style={{ display:'flex', gap:16 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ background: bg, border:`1px solid ${border}`, borderRadius:6, padding:'10px 16px', marginBottom:6, color: text, fontSize:10 }}>Import</div>
          <div style={{ color: secondary, fontSize:9, lineHeight:1.5 }}>Load a .json<br/>map file</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ background: accent, borderRadius:6, padding:'10px 16px', marginBottom:6, color:'#fff', fontSize:10 }}>Export</div>
          <div style={{ color: secondary, fontSize:9, lineHeight:1.5 }}>Save as .json<br/>or Print as PNG</div>
        </div>
      </div>
      <div style={{ color: secondary, fontSize:10 }}>Use File → Import / Export or Print</div>
    </div>
  );
}
export default ImportExportDemo;

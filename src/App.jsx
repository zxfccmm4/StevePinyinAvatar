import React, { useState, useRef, useEffect } from 'react';
import Avatar, { genConfig } from 'react-nice-avatar';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateVCard } from './utils/vcard';
import MagicInput from './components/MagicInput';
import MagicButton from './components/MagicButton';
// No LiquidGlass, using standard components

const translations = {
  en: {
    title: "StevePinyin Avatar",
    subtitle: "Unlock your visual identity. Batch generate consistent avatars for Earth & Cloud.",
    quantity: "Quantity",
    generate: "Generate Intelligence",
    export_contacts: "IOS CONTACTS",
    contacts_title: "Contacts Framework",
    contacts_desc: "Export avatars to a .vcf file for instant integration with iOS/macOS Contacts.",
    steve_mode: "StevePinyin Mode",
    download_vcf: "Download .vcf",
    cloud_sync: "CLOUD SYNC",
    repo_sync: "Repository Sync",
    download_zip: "Zip Pkg",
    upload: "Upload",
    generated_assets: "Generated Assets",
    no_avatars: "Awaiting Input...",
    input_placeholder: "Enter quantity and press Enter...",
    guide: "Guide",
    github: "GitHub"
  },
  zh: {
    title: "StevePinyin Avatar",
    subtitle: "解锁你的视觉身份。为你的数字生态批量生成一致性头像。",
    quantity: "数量",
    generate: "生成智能",
    export_contacts: "iOS 通讯录",
    contacts_title: "通讯录集成",
    contacts_desc: "导出 .vcf 文件，一键导入 iOS/macOS 通讯录头像。",
    steve_mode: "StevePinyin 模式",
    download_vcf: "下载 .vcf",
    cloud_sync: "云端同步",
    repo_sync: "仓库同步",
    download_zip: "打包下载",
    upload: "上传",
    generated_assets: "生成资产",
    no_avatars: "等待输入...",
    input_placeholder: "输入生成头像数量按回车生成",
    guide: "指南",
    github: "GitHub"
  }
};

function App() {
  const [lang, setLang] = useState('zh'); // Default Chinese
  const [theme, setTheme] = useState('auto'); // light, dark, auto
  const t = translations[lang];

  const [count, setCount] = useState(''); // Empty by default to show placeholder
  const [avatars, setAvatars] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // const [progress, setProgress] = useState(0); // Unused visual progress for now
  const [baseUrl, setBaseUrl] = useState('');
  const [customRepoUrl, setCustomRepoUrl] = useState('https://github.com/zxfccmm4/StevePinyinAvatar.git');
  const [targetFolder, setTargetFolder] = useState('');
  const [isStevePinyinMode, setIsStevePinyinMode] = useState(true);
  const avatarRefs = useRef([]);

  // Theme Effect
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (targetTheme) => {
      if (targetTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    };

    if (theme === 'auto') {
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(darkQuery.matches ? 'dark' : 'light');
      const handler = (e) => applyTheme(e.matches ? 'dark' : 'light');
      darkQuery.addEventListener('change', handler);
      return () => darkQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const handleGenerateConfig = () => {
    // Default to 50 if empty or invalid
    const quantity = Number(count) > 0 ? Number(count) : 50;
    // Update count to reflect used value if it was empty? Maybe not to keep it clean. 
    // Or maybe we should set it so user knows what happened. Let's set it.
    if (!count) setCount(50);

    const newAvatars = Array.from({ length: quantity }).map((_, i) => ({
      id: i,
      config: genConfig(),
      name: `Avatar ${String(i + 1).padStart(3, '0')}`
    }));
    setAvatars(newAvatars);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleGenerateConfig();
    }
  };

  const generateImages = async (scale = 5, format = 'png') => {
    const images = [];
    for (let i = 0; i < avatars.length; i++) {
      const el = avatarRefs.current[i];
      if (el) {
        try {
          const method = format === 'png' ? domtoimage.toPng : domtoimage.toJpeg;
          const dataUrl = await method(el, {
            width: el.offsetWidth * scale,
            height: el.offsetHeight * scale,
            style: {
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${el.offsetWidth}px`,
              height: `${el.offsetHeight}px`
            },
            bgcolor: null
          });
          images.push({
            name: `avatar_${i + 1}.${format}`,
            data: dataUrl.split(',')[1],
            dataUrl: dataUrl
          });
        } catch (err) {
          console.error("Error capturing avatar", i, err);
        }
      }
      await new Promise(r => setTimeout(r, 10));
    }
    return images;
  }

  const handleExportVCard = async () => {
    if (avatars.length === 0) return;
    setIsGenerating(true);
    const format = isStevePinyinMode ? 'png' : 'jpeg';
    const images = await generateImages(3, format);
    const contacts = images.map((img, i) => ({
      name: avatars[i].name,
      imageBase64: img.dataUrl
    }));
    const vcardContent = generateVCard(contacts, {
      isCompany: isStevePinyinMode,
      organization: isStevePinyinMode ? 'StevePinyin' : '',
      imageType: format.toUpperCase()
    });
    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
    saveAs(blob, 'avatars.vcf');
    setIsGenerating(false);
  };

  const handleExportStevePinyin = async () => {
    if (avatars.length === 0) return;
    setIsGenerating(true);
    const zip = new JSZip();
    const images = await generateImages(5, 'png');
    const iconsConfig = [];
    images.forEach((img) => {
      zip.file(img.name, img.data, { base64: true });
      const fileUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/${img.name}` : img.name;
      iconsConfig.push({ name: img.name.replace('.png', ''), url: fileUrl });
    });
    const config = { name: "Generated Avatars", description: "Exported from Avatar Studio", icons: iconsConfig };
    zip.file("config.json", JSON.stringify(config, null, 2));
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "steve_pinyin_avatars.zip");
    setIsGenerating(false);
  };

  const handleUploadToGitHub = async () => {
    if (avatars.length === 0) return;
    if (!customRepoUrl) { alert("Please enter a Repo URL."); return; }
    if (!confirm(`Confirm upload to ${customRepoUrl}?`)) return;
    setIsUploading(true);
    setIsGenerating(true);
    try {
      const images = await generateImages(5, 'png');
      const iconsConfig = [];
      let rawBaseUrl = '';
      if (customRepoUrl.includes('github.com')) {
        const parts = customRepoUrl.replace('.git', '').split('github.com/');
        if (parts[1]) {
          rawBaseUrl = `https://raw.githubusercontent.com/${parts[1]}/main`;
          if (targetFolder) rawBaseUrl += `/${targetFolder}`;
        }
      }
      images.forEach((img) => {
        iconsConfig.push({ name: img.name.replace('.png', ''), url: rawBaseUrl ? `${rawBaseUrl}/${img.name}` : img.name });
      });
      const config = { name: "StevePinyin Avatars", description: "Auto-uploaded", icons: iconsConfig };
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, config, repoUrl: customRepoUrl, folderPath: targetFolder })
      });
      const result = await response.json();
      alert(result.success ? "Upload successful!" : "Upload failed: " + result.message);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsUploading(false);
      setIsGenerating(false);
    }
  };

  // --- STYLES ---

  const containerStyle = {
    maxWidth: '980px',
    margin: '0 auto',
    padding: '40px 20px 80px 20px',
    paddingTop: '60px'
  };

  const toggleBtnStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s'
  };

  const activeToggleStyle = {
    ...toggleBtnStyle,
    color: 'var(--text-primary)',
    background: 'var(--bg-tertiary)'
  };

  // Apple Pill Input
  const inputStyle = {
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    fontFamily: 'monospace'
  };

  // Apple Button Base (Pill)
  const btnBase = {
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '980px', // Full pill
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  };

  const btnPrimary = {
    ...btnBase,
    background: 'var(--btn-bg)',
    color: 'var(--btn-text)',
  };

  const btnSecondary = {
    ...btnBase,
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
  };

  const sectionHeaderStyle = {
    fontSize: '56px',
    lineHeight: '1.07143',
    fontWeight: '600',
    letterSpacing: '-0.005em',
    color: 'var(--text-primary)',
    textAlign: 'center',
    marginTop: '20px',
    marginBottom: '15px'
  };

  const sectionSubheaderStyle = {
    fontSize: '24px',
    lineHeight: '1.16667',
    fontWeight: '600',
    letterSpacing: '0.009em',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    maxWidth: '660px',
    margin: '0 auto 50px auto'
  };

  const footerLinkStyle = {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '12px',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  return (
    <>
      <div style={containerStyle}>

        {/* Toggle Controls (Top Right) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
          {/* Lang Toggle */}
          <div style={{ background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '2px' }}>
            <button onClick={() => setLang('zh')} style={lang === 'zh' ? activeToggleStyle : toggleBtnStyle}>中</button>
            <button onClick={() => setLang('en')} style={lang === 'en' ? activeToggleStyle : toggleBtnStyle}>En</button>
          </div>
          {/* Theme Toggle */}
          <div style={{ background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '2px' }}>
            <button onClick={() => setTheme('light')} style={theme === 'light' ? activeToggleStyle : toggleBtnStyle}>☀️</button>
            <button onClick={() => setTheme('dark')} style={theme === 'dark' ? activeToggleStyle : toggleBtnStyle}>🌙</button>
            <button onClick={() => setTheme('auto')} style={theme === 'auto' ? activeToggleStyle : toggleBtnStyle}>🖥️</button>
          </div>
        </div>

        {/* Hero Section */}
        <header>
          <h1 style={sectionHeaderStyle}>
            {t.title}
          </h1>
          <p style={sectionSubheaderStyle}>
            {t.subtitle}
          </p>

          {/* Unified Command Bar */}
          <div className="search-container">
            <div className="search-bar" id="search-bar">
              <div className="search-bar-inner">
                {/* Icon */}
                <div style={{ color: 'var(--text-secondary)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>

                {/* Quantity Input */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <input
                    className="search-bar-input"
                    type="number"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                    placeholder={t.input_placeholder}
                    style={{ width: '100%', padding: 0, height: '32px', fontSize: '18px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Feature Grid (Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '80px' }}>

          {/* Card 1: VCard */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '36px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', border: '1px solid var(--border-color)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0071e3, #00C6FF)', color: 'white', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, marginBottom: '15px' }}>{t.export_contacts}</div>
            <h3 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{t.contacts_title}</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '30px', flex: 1 }}>
              {t.contacts_desc}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={isStevePinyinMode} onChange={(e) => setIsStevePinyinMode(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{t.steve_mode}</span>
            </div>
            <button
              onClick={handleExportVCard}
              disabled={avatars.length === 0}
              style={{ ...btnSecondary, marginTop: '20px', width: '100%', padding: '12px', fontSize: '14px', opacity: avatars.length === 0 ? 0.4 : 1 }}
            >
              {t.download_vcf}
            </button>
          </div>

          {/* Card 2: GitHub / Cloud */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '36px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', border: '1px solid var(--border-color)' }}>
            <div style={{ background: 'linear-gradient(135deg, #30d158, #38ef7d)', color: 'white', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, marginBottom: '15px' }}>{t.cloud_sync}</div>
            <h3 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{t.repo_sync}</h3>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px', flex: 1 }}>

              <MagicInput
                value={customRepoUrl}
                onChange={(e) => setCustomRepoUrl(e.target.value)}
                placeholder="Repo URL..."
              />

              <MagicInput
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                placeholder="Target Folder..."
              />

            </div>
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={handleUploadToGitHub}
                disabled={avatars.length === 0}
                style={{ ...btnSecondary, flex: 1, padding: '12px', fontSize: '14px', opacity: avatars.length === 0 ? 0.4 : 1 }}
              >
                {isUploading ? '...' : t.upload}
              </button>
              <button
                onClick={handleExportStevePinyin}
                disabled={avatars.length === 0}
                style={{ ...btnSecondary, flex: 1, padding: '12px', fontSize: '14px', opacity: avatars.length === 0 ? 0.4 : 1 }}
              >
                {t.download_zip}
              </button>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px solid var(--border-color)', marginBottom: '80px' }}></div>

        {/* Avatar Grid */}
        <div>
          {avatars.length > 0 ? (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>{t.generated_assets}</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '40px',
                padding: '0',
              }}>
                {avatars.map((item, index) => (
                  <div key={item.id} style={{
                    background: 'var(--card-bg)',
                    borderRadius: '20px',
                    padding: '10px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s ease',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)'
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div ref={el => avatarRefs.current[index] = el} style={{ transform: 'scale(1)', marginBottom: '10px' }}>
                      <Avatar style={{ width: '90px', height: '90px' }} {...item.config} />
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace'
                    }}>
                      #{String(index + 1).padStart(3, '0')}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border-color)', borderRadius: '24px' }}>
              <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{t.no_avatars}</div>
            </div>
          )}
        </div>

        {/* Footer Credits */}
        <footer style={{ marginTop: '100px', borderTop: '1px solid var(--border-color)', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            © {new Date().getFullYear()} StevePinyin Avatar.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="https://x.com/st7evechou" target="_blank" rel="noopener noreferrer" style={footerLinkStyle}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              @st7evechou
            </a>
            <a href="https://github.com/zxfccmm4" target="_blank" rel="noopener noreferrer" style={footerLinkStyle}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              GitHub
            </a>
          </div>
        </footer>

      </div>
    </>
  );
}

export default App;

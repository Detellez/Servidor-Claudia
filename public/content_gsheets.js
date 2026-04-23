(function() {
    'use strict';

    // ==========================================
    // 1. CONFIGURACIÓN GLOBAL
    // ==========================================
    const CEREBRO_URL = 'https://script.google.com/macros/s/AKfycbza0-zudKSnFi43LxJAhYoNRbcGfSrrPjzU3iQF0Ah62S9_5-BxUUYVpxpZAXFccC3P-w/exec';
    const API_URL = CEREBRO_URL;
    const SECURITY_TOKEN = 'SST_V12_CORP_SECURE_2026_X9';

    const getLoggedUser = () => localStorage.getItem('usuarioLogueado');

    // ==========================================
    // 2. UTILIDADES COMPARTIDAS (UI Y LÓGICA)
    // ==========================================
    function showNotification(message, duration = 3000, type = 'info') {
        document.querySelectorAll('.addon-aviso-temp').forEach(el => el.remove());

        const toast = document.createElement('div');
        toast.className = 'addon-aviso-temp';
        
        let icon = 'ℹ️', accentColor = '#3b82f6';
        if (type === 'success' || message.includes('✅')) { icon = '✅'; accentColor = '#10b981'; } 
        else if (type === 'error' || message.includes('❌') || message.includes('⛔')) { icon = '⛔'; accentColor = '#ef4444'; } 
        else if (type === 'warning' || message.includes('⚠️')) { icon = '⚠️'; accentColor = '#f59e0b'; }

        toast.innerHTML = `<span style="font-size:16px; margin-right:10px;">${icon}</span><span style="font-weight:600; font-size:13px; color: #fff; letter-spacing: 0.5px;">${message}</span>`;
        Object.assign(toast.style, {
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', 
            backgroundColor: 'rgba(10, 15, 30, 0.95)', color: '#ffffff', borderRadius: '50px', zIndex: '2147483640',
            boxShadow: `0 0 15px ${accentColor}40`, border: `1px solid ${accentColor}`, backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', fontFamily: "'Segoe UI', sans-serif"
        });

        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, duration);
    }

    const applyDynamicHover = (btn, targetColor) => {
        const baseStyle = { backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', transform: 'scale(1)', boxShadow: 'none' };
        const hoverStyle = { backgroundColor: targetColor, border: `1px solid ${targetColor}`, color: '#ffffff', transform: 'translateY(-1px)', boxShadow: `0 2px 10px ${targetColor}60` };
        
        Object.assign(btn.style, baseStyle);
        btn.onmouseenter = () => { if (btn.dataset.active !== "true") Object.assign(btn.style, hoverStyle); };
        btn.onmouseleave = () => { if (btn.dataset.active !== "true") Object.assign(btn.style, baseStyle); };
        btn.onmousedown = () => { if (btn.dataset.active !== "true") btn.style.transform = 'scale(0.96)'; };
        btn.onmouseup = () => { if (btn.dataset.active !== "true") btn.style.transform = 'translateY(-1px)'; }; 
    };

    const makeDraggable = (elmnt, header) => {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        header.onmousedown = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; 
            e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY;
            document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; }; 
            document.onmousemove = (e) => {
                e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
                elmnt.style.top = (elmnt.offsetTop - pos2) + "px"; elmnt.style.left = (elmnt.offsetLeft - pos1) + "px"; elmnt.style.right = "auto"; elmnt.style.bottom = "auto";
            };
        };
    };

    const parseNumberFromCell = (cell) => {
        const text = (cell ? (cell.innerText || cell.textContent).trim() : "0");
        const num = parseFloat(text.replace(/[^0-9.-]+/g, ""));
        return isNaN(num) ? 0 : num;
    };

    const getGradientColor = (percentage) => {
        let p = Math.max(0, Math.min(100, percentage)) / 100;
        let r = p < 0.5 ? 255 : Math.round(255 - (p - 0.5) * 2 * 255);
        let g = p > 0.5 ? 255 : Math.round(p * 2 * 255);
        return `rgb(${r}, ${g}, 0)`;
    };


    // ==========================================
    // 3. MÓDULO: PANEL GSHEETS (pedding_list)
    // ==========================================
    function buildGSheetsPanel() {
        if (document.querySelector('.addon-panel-independent')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'addon-panel-independent';
        Object.assign(wrapper.style, {
            position: 'fixed', left: '0', bottom: '0', zIndex: '2147483640',
            display: 'flex', flexDirection: 'column-reverse', alignItems: 'flex-start',
            pointerEvents: 'none', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        });

        const menuContent = document.createElement('div');
        Object.assign(menuContent.style, {
            pointerEvents: 'auto', backgroundColor: 'rgba(10, 15, 30, 0.75)', 
            backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)',
            padding: '12px', borderRadius: '14px', display: 'none', flexDirection: 'column', gap: '6px', 
            width: '260px', border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)', position: 'relative', 
            marginLeft: '10px', marginBottom: '10px', transformOrigin: 'bottom left'
        });

        const hidePanel = () => { menuContent.style.display = 'none'; toggleBtn.style.display = 'flex'; };

        const minimizeBtn = document.createElement('div');
        minimizeBtn.innerHTML = '×'; minimizeBtn.title = "Ocultar Panel";
        Object.assign(minimizeBtn.style, {
            position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.2s ease', border: '1px solid rgba(255,255,255,0.1)'
        });
        minimizeBtn.onmouseenter = () => { minimizeBtn.style.background = 'rgba(255,255,255,0.25)'; minimizeBtn.style.color = '#fff'; minimizeBtn.style.transform = 'scale(1.1)'; };
        minimizeBtn.onmouseleave = () => { minimizeBtn.style.background = 'rgba(255,255,255,0.1)'; minimizeBtn.style.color = 'rgba(255,255,255,0.8)'; minimizeBtn.style.transform = 'scale(1)'; };
        minimizeBtn.onclick = hidePanel;

        const headerContent = document.createElement('div');
        headerContent.innerHTML = `
            <div style="text-align:center; margin-bottom: 2px; margin-top: 2px;">
                <div style="color:#ffffff; font-size:14px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase;">PANEL CONTROL</div>
                <div style="font-size:11px; color:#9ca3af;">Usuario: <span id="lbl-usuario-panel" style="font-weight:700; color:#fbbf24; text-shadow: 0 0 5px rgba(251, 191, 36, 0.6);">Cargando...</span></div>
                <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); margin: 8px 0;"></div>
            </div>
        `;

        menuContent.appendChild(minimizeBtn); menuContent.appendChild(headerContent);

        const btnOpenSheet = document.createElement('button');
        btnOpenSheet.innerText = 'ABRIR MI HOJA';
        Object.assign(btnOpenSheet.style, { width: '100%', padding: '7px', borderRadius: '6px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', marginBottom: '5px', transition: 'all 0.2s ease-out' });
        applyDynamicHover(btnOpenSheet, '#1877f2'); 

        btnOpenSheet.onclick = async () => {
            hidePanel(); const user = getLoggedUser();
            if (!user) return showNotification('❌ Falta Usuario', 3000, 'error');
            showNotification('🔍 Buscando hoja...', 2000);
            try {
                const response = await fetch(`${API_URL}?token=${SECURITY_TOKEN}&usuario=${user}`);
                const data = await response.json();
                if (data.id) window.open('https://docs.google.com/spreadsheets/d/' + data.id + '/edit', '_blank');
                else showNotification('❌ Sin hoja asignada', 3000, 'error');
            } catch (err) { showNotification('⚠️ Error conexión', 3000, 'warning'); }
        };
        menuContent.appendChild(btnOpenSheet);

        const grid = document.createElement('div');
        Object.assign(grid.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' });

        const createActionBtn = (text, targetColor, action) => {
            const btn = document.createElement('button'); btn.innerText = text;
            btn.onclick = () => { hidePanel(); action(); };
            Object.assign(btn.style, { padding: '7px 5px', width: '100%', fontSize: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' });
            applyDynamicHover(btn, targetColor); return btn;
        };

        grid.append(createActionBtn('Actualizar G', '#f59e0b', async () => {
            const user = getLoggedUser(); if (!user) return showNotification('❌ Falta Usuario', 3000, 'error');
            const tableBody = document.querySelector('table.el-table__body'); if (!tableBody) return showNotification('❌ Sin tabla', 3000, 'error');
            if (!confirm('⚠️ USUARIO: ' + user + '\n\n¿Actualizar tu hoja personal?')) return;
            try {
                showNotification('Limpiando...', 1500);
                await new Promise((res, rej) => { chrome.runtime.sendMessage({ action: 'proxy_fetch', url: API_URL, options: { method: 'POST', body: JSON.stringify({ token: SECURITY_TOKEN, vendedor: user, action: 'delete' }) } }, r => r && r.success ? res() : rej(r?.error)); });
                await new Promise(r => setTimeout(r, 500)); showNotification('Enviando...', 2000);
                const rows = Array.from(tableBody.querySelectorAll('tr')).map(tr => Array.from(tr.querySelectorAll('td, th')).map(td => td.innerText.trim()));
                await new Promise((res, rej) => { chrome.runtime.sendMessage({ action: 'proxy_fetch', url: API_URL, options: { method: 'POST', body: JSON.stringify({ token: SECURITY_TOKEN, vendedor: user, tabla: rows, action: 'send' }) } }, r => r && r.success ? res() : rej(r?.error)); });
                showNotification('Actualizado ✅', 3000, 'success');
            } catch (err) { showNotification('❌ Error: ' + err, 4000, 'error'); }
        }));

        grid.append(createActionBtn('Reset G', '#c0392b', async () => {
            const user = getLoggedUser(); if (!user) return showNotification('❌ Falta Usuario', 3000, 'error');
            if (!confirm('¿Resetear hoja para nueva gestión?')) return; showNotification('Reseteando...', 2000);
            try {
                await new Promise((res, rej) => { chrome.runtime.sendMessage({ action: 'proxy_fetch', url: API_URL, options: { method: 'POST', body: JSON.stringify({ token: SECURITY_TOKEN, vendedor: user, action: 'reset' }) } }, r => r && r.success ? res() : rej(r?.error)); });
                showNotification('Reseteada ✅', 3000, 'success');
            } catch (e) { showNotification('❌ Error Reset', 3000, 'error'); }
        }));

        grid.append(createActionBtn('Enviar G', '#10b981', async () => {
            const user = getLoggedUser(); if (!user) return showNotification('❌ Falta Usuario', 3000, 'error');
            const tableBody = document.querySelector('table.el-table__body'); if (!tableBody || !confirm('¿Enviar datos adicionales?')) return; showNotification('Enviando...', 2000);
            const rows = Array.from(tableBody.querySelectorAll('tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()));
            try {
                await new Promise((res, rej) => { chrome.runtime.sendMessage({ action: 'proxy_fetch', url: API_URL, options: { method: 'POST', body: JSON.stringify({ token: SECURITY_TOKEN, vendedor: user, tabla: rows, action: 'send' }) } }, r => r && r.success ? res() : rej(r?.error)); });
                showNotification('Enviado ✅', 3000, 'success');
            } catch (e) { showNotification('❌ Error Envio', 3000, 'error'); }
        }));

        grid.append(createActionBtn('Eliminar G', '#ea580c', async () => {
            const user = getLoggedUser(); if (!user) return showNotification('❌ Falta Usuario', 3000, 'error');
            if (!confirm('¿Eliminar datos de la hoja?')) return; showNotification('Eliminando...', 2000);
            try {
                await new Promise((res, rej) => { chrome.runtime.sendMessage({ action: 'proxy_fetch', url: API_URL, options: { method: 'POST', body: JSON.stringify({ token: SECURITY_TOKEN, vendedor: user, action: 'delete' }) } }, r => r && r.success ? res() : rej(r?.error)); });
                showNotification('Datos eliminados ✅', 3000, 'success');
            } catch (e) { showNotification('❌ Error Eliminar', 3000, 'error'); }
        }));

        grid.append(createActionBtn('Copy Data', '#0d9488', () => {
            const tableBody = document.querySelector('table.el-table__body');
            if (tableBody) {
                const text = Array.from(tableBody.querySelectorAll('tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()).join('\t')).join('\n');
                navigator.clipboard.writeText(text).then(() => showNotification('Datos copiados 📋', 1500));
            }
        }));

        grid.append(createActionBtn('Copy HTML', '#8b5cf6', () => {
            const tableBody = document.querySelector('table.el-table__body');
            if (tableBody) navigator.clipboard.writeText(tableBody.outerHTML).then(() => showNotification('HTML copiado 📋', 1500));
        }));

        menuContent.appendChild(grid);

        const toggleBtn = document.createElement('div');
        Object.assign(toggleBtn.style, {
            width: '45px', height: '45px', backgroundColor: 'rgba(10, 15, 30, 0.95)', color: 'white',
            borderRadius: '0 24px 0 0', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end',
            paddingLeft: '10px', paddingBottom: '10px', boxSizing: 'border-box', cursor: 'pointer', fontSize: '22px', fontWeight: 'bold', 
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', borderTop: '1px solid rgba(255,255,255,0.2)', borderRight: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 -4px 15px rgba(0,0,0,0.3)', pointerEvents: 'auto', backdropFilter: 'blur(10px)'
        });
        toggleBtn.innerHTML = '+';
        toggleBtn.onmouseenter = () => { toggleBtn.style.width = '50px'; toggleBtn.style.height = '50px'; toggleBtn.style.color = '#fbbf24'; toggleBtn.style.borderColor = '#fbbf24'; };
        toggleBtn.onmouseleave = () => { toggleBtn.style.width = '45px'; toggleBtn.style.height = '45px'; toggleBtn.style.color = 'white'; toggleBtn.style.borderColor = 'rgba(255,255,255,0.2)'; };

        toggleBtn.onclick = () => {
            toggleBtn.style.display = 'none'; menuContent.style.display = 'flex';
            menuContent.style.opacity = '0'; menuContent.style.transform = 'scale(0.9) translateY(10px)';
            setTimeout(() => { menuContent.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; menuContent.style.opacity = '1'; menuContent.style.transform = 'scale(1) translateY(0)'; }, 10);
        };

        wrapper.append(menuContent, toggleBtn);
        document.body.appendChild(wrapper);

        // Tracker de usuario para este panel
        window._gsheetsUserTracker = setInterval(() => {
            const label = document.getElementById('lbl-usuario-panel');
            if (label) {
                const user = getLoggedUser();
                if (user) { if (label.innerText !== user) { label.innerText = user; label.style.color = '#fbbf24'; } } 
                else if (label.innerText !== 'Sin Usuario') { label.innerText = 'Sin Usuario'; label.style.color = '#ef4444'; }
            }
        }, 1000);
    }


    // ==========================================
    // 4. MÓDULO: PANEL PLANILLA (urge_performance)
    // ==========================================
    const injectPlanillaCSS = () => {
        if (document.getElementById('estilos-resaltador-crm')) return;
        const style = document.createElement('style'); style.id = 'estilos-resaltador-crm';
        style.innerHTML = `
            td.resaltado-exacto, tr.resaltado-exacto > td { background-color: #ffff00 !important; color: #000000 !important; }
            .el-table--enable-row-hover .el-table__body tr:hover > td.resaltado-exacto,
            .el-table__body tr.hover-row > td.resaltado-exacto { background-color: #ffff00 !important; }
            body.pintura-activa .el-table__body td { cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24'><text y='20' font-size='20'>🖌️</text></svg>") 0 20, pointer !important; }
            td.manual-amarillo { background-color: #ffff00 !important; color: #000000 !important; }
            td.manual-rojo { background-color: #ff3333 !important; color: #000000 !important; }
            .el-table--enable-row-hover .el-table__body tr:hover > td.manual-amarillo { background-color: #ffff00 !important; }
            .el-table--enable-row-hover .el-table__body tr:hover > td.manual-rojo { background-color: #ff3333 !important; }
            .drag-header { cursor: move; user-select: none; }
            .dark-ui-input { background: rgba(0,0,0,0.4) !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.2) !important; border-radius: 6px; padding: 6px; outline: none; transition: 0.2s; font-family: monospace; }
            .dark-ui-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 8px rgba(59,130,246,0.5) !important; }
            .dark-ui-input::placeholder { color: rgba(255,255,255,0.6) !important; font-family: 'Segoe UI', sans-serif; font-weight: normal; text-align: center; }
            .glass-checkbox { appearance: none; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.4); width: 14px; height: 14px; border-radius: 3px; cursor: pointer; position: relative; display: inline-block; vertical-align: middle; transition: 0.2s; margin: 0; }
            .glass-checkbox:checked { background: #3b82f6; border-color: #3b82f6; }
            .glass-checkbox:checked::after { content: '✔'; position: absolute; color: white; font-size: 10px; left: 2px; top: -1px; }
            .slot-machine::-webkit-scrollbar { width: 0px; } .slot-machine { scrollbar-width: none; white-space: pre; }
            .glass-scroll::-webkit-scrollbar { width: 6px; } .glass-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
            .glass-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 4px; }
            .glass-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
            .lbl-white { color: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.5); margin: 0; }
            .leaderboard-table { width: 100%; border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #fff; text-align: center; }
            .leaderboard-table th { background-color: #a32020; color: #ffffff; padding: 10px; font-size: 12px; font-weight: bold; letter-spacing: 1px; border-bottom: 2px solid #7a1515; }
            .leaderboard-table td { padding: 10px 8px; border-bottom: 1px solid #f0ecec; color: #333; font-size: 13px; }
            .leaderboard-table tr:nth-child(even) td { background-color: #fafafa; }
            .btn-lb { flex: 1; padding: 12px; border: none; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 13px; transition: 0.2s; color: white; display: flex; justify-content: center; align-items: center; }
            .btn-excel { background-color: #217346; } .btn-excel:hover { background-color: #1e6b41; }
            .btn-img { background-color: #a32020; } .btn-img:hover { background-color: #8c1b1b; }
        `;
        document.head.appendChild(style);
    };

    const obtenerSufijosDinamicos = () => {
        let sufijos = { cuenta: null, seg: null, pagos: null, monto: null, rend: null };
        const headers = document.querySelectorAll('.el-table__header-wrapper th, .el-table__fixed-header-wrapper th');
        headers.forEach(th => {
            const text = (th.innerText || th.textContent).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const match = th.className.match(/_column_\d+/); if (!match) return; const suffix = match[0];
            if (text.includes('cuenta de cobra') || text.includes('cuenta')) sufijos.cuenta = suffix;
            else if (text.includes('numero de segui')) sufijos.seg = suffix;
            else if (text.includes('cobros completados') || text.includes('pago completo')) { if (!text.includes('tasa')) sufijos.pagos = suffix; } 
            else if (text.includes('monto de cobra')) sufijos.monto = suffix;
            else if (text.includes('tasa de recuperaci') || text.includes('tasa de recu')) sufijos.rend = suffix;
        }); return sufijos;
    };

    const getCuentasBuscadas = () => document.getElementById('txt-cuentas-side').value.split('\n').filter(val => val.trim() !== '');

    function buildPlanillaPanel() {
        if (document.getElementById('wrapper-panel-crm')) return;
        injectPlanillaCSS();

        const wrapper = document.createElement('div'); wrapper.id = 'wrapper-panel-crm';
        Object.assign(wrapper.style, { position: 'fixed', left: '0', bottom: '0', zIndex: '2147483630', display: 'flex', flexDirection: 'column-reverse', alignItems: 'flex-start', pointerEvents: 'none', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" });

        const menuContent = document.createElement('div');
        Object.assign(menuContent.style, { pointerEvents: 'auto', backgroundColor: 'rgba(10, 15, 30, 0.75)', backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)', padding: '12px', borderRadius: '14px', display: 'none', flexDirection: 'column', width: '280px', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)', position: 'relative', marginBottom: '10px', marginLeft: '10px', transformOrigin: 'bottom left' });

        const toggleBtn = document.createElement('div');
        Object.assign(toggleBtn.style, { width: '45px', height: '45px', backgroundColor: 'rgba(10, 15, 30, 0.95)', color: 'white', borderRadius: '0 24px 0 0', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', paddingLeft: '10px', paddingBottom: '10px', boxSizing: 'border-box', cursor: 'pointer', fontSize: '22px', fontWeight: 'bold', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', borderTop: '1px solid rgba(255,255,255,0.2)', borderRight: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 -4px 15px rgba(0,0,0,0.3)', pointerEvents: 'auto', backdropFilter: 'blur(10px)' });
        toggleBtn.innerHTML = '🔍'; 
        toggleBtn.onmouseenter = () => { toggleBtn.style.width='50px'; toggleBtn.style.height='50px'; toggleBtn.style.color='#fbbf24'; toggleBtn.style.borderColor='#fbbf24'; };
        toggleBtn.onmouseleave = () => { toggleBtn.style.width='45px'; toggleBtn.style.height='45px'; toggleBtn.style.color='white'; toggleBtn.style.borderColor='rgba(255,255,255,0.2)'; };

        const minimizeBtn = document.createElement('div'); minimizeBtn.innerHTML = '×'; 
        Object.assign(minimizeBtn.style, { position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.2s ease', border: '1px solid rgba(255,255,255,0.1)', zIndex: 10 });
        minimizeBtn.onmouseenter = () => { minimizeBtn.style.background='rgba(255,255,255,0.25)'; minimizeBtn.style.color='#fff'; minimizeBtn.style.transform='scale(1.1)'; };
        minimizeBtn.onmouseleave = () => { minimizeBtn.style.background='rgba(255,255,255,0.1)'; minimizeBtn.style.color='rgba(255,255,255,0.8)'; minimizeBtn.style.transform='scale(1)'; };

        toggleBtn.onclick = () => {
            toggleBtn.style.display = 'none'; menuContent.style.display = 'flex';
            menuContent.style.opacity = '0'; menuContent.style.transform = 'scale(0.9) translateY(10px)';
            setTimeout(() => { menuContent.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; menuContent.style.opacity = '1'; menuContent.style.transform = 'scale(1) translateY(0)'; }, 10);
        };
        const hidePanel = () => { menuContent.style.display = 'none'; sidePanel.style.display = 'none'; toggleBtn.style.display = 'flex'; };
        minimizeBtn.onclick = hidePanel;

        const sidePanel = document.createElement('div'); sidePanel.id = 'panel-lateral-cuentas';
        Object.assign(sidePanel.style, { position: 'absolute', left: 'calc(100% + 10px)', bottom: '0px', width: '180px', backgroundColor: 'rgba(10, 15, 30, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '10px 10px 40px rgba(0, 0, 0, 0.5)', display: 'none', flexDirection: 'column', padding: '10px' });
        sidePanel.innerHTML = `
            <div style="color:#ffffff; font-size:11px; font-weight:800; margin-bottom: 5px; display:flex; justify-content:space-between; align-items:center;">
                <span>📋 CUENTAS</span><span id="btn-cerrar-side" style="cursor:pointer; color:#ef4444; font-size: 16px;">&times;</span>
            </div>
            <textarea id="txt-cuentas-side" class="dark-ui-input glass-scroll" style="width: 100%; min-height: 80px; resize: none; font-size: 11px; line-height: 1.5; box-sizing: border-box; overflow-y: hidden; margin: 0; padding: 6px;"></textarea>
        `;

        const headerContent = document.createElement('div'); headerContent.id = "panel-drag-handle"; headerContent.style.cursor = "move";
        headerContent.innerHTML = `<div style="text-align:center; margin-bottom: 2px;"><div style="color:#ffffff; font-size:15px; font-weight:900; letter-spacing:1px; text-transform:uppercase; padding: 5px 0;">FILTRO PANEL</div><div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); margin: 4px 0;"></div></div>`;

        const mainContent = document.createElement('div');
        mainContent.innerHTML = `
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <textarea id="txt-cuentas-slot" class="dark-ui-input slot-machine" style="flex: 1; height: 32px; line-height: 18px; font-size: 11px; text-align: center; resize: none; overflow-y: auto; padding: 6px 0;" placeholder="Pegar Cuentas..."></textarea>
                <button id="btn-lupa" style="width: 32px; border-radius: 6px; display: flex; justify-content: center; align-items: center; font-size: 14px; cursor: pointer; transition: 0.2s;">🔍</button>
            </div>
            <div style="display: flex; gap: 5px; margin-bottom: 10px; height: 34px;">
                <button id="btn-generar-leaderboard" style="flex: 1.2; border-radius: 6px; cursor: pointer; font-weight: 800; font-size: 11px; transition: all 0.2s;">📊 REPORTE</button>
                <div style="flex: 1; display: flex; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; overflow: hidden;" id="pincel-container">
                    <button id="btn-toggle-paint" style="flex: 1; background: transparent; border: none; color: #ffffff; font-weight: bold; font-size: 11px; cursor: pointer; transition: 0.2s;">🖌️ OFF</button>
                    <button id="btn-switch-color" style="width: 28px; background: rgba(0,0,0,0.4); border: none; border-left: 1px solid rgba(255,255,255,0.15); cursor: pointer; font-size: 12px; display: none;">🟡</button>
                </div>
            </div>
            <div style="padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1); box-sizing: border-box; width: 100%;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center;"><label class="lbl-white"><input type="checkbox" class="glass-checkbox" id="chk-seg"> Seguimientos</label><input type="number" id="input-seg" class="dark-ui-input" placeholder="< a..." style="width: 100px; padding: 4px; height: 24px; box-sizing: border-box;"></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center;"><label class="lbl-white"><input type="checkbox" class="glass-checkbox" id="chk-pagos"> Pagos</label><input type="number" id="input-pagos" class="dark-ui-input" placeholder="< a..." style="width: 100px; padding: 4px; height: 24px; box-sizing: border-box;"></div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><label class="lbl-white"><input type="checkbox" class="glass-checkbox" id="chk-monto"> Monto (R/V)</label><label class="lbl-white"><input type="checkbox" class="glass-checkbox" id="chk-rend"> Rendim. (R/V)</label></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <button id="btn-resaltar" style="border-radius: 6px; font-weight: 800; font-size: 11px; padding: 8px;">PINTAR</button>
                <button id="btn-limpiar" style="border-radius: 6px; font-weight: 800; font-size: 11px; padding: 8px;">LIMPIAR</button>
            </div>
        `;

        menuContent.append(minimizeBtn, sidePanel, headerContent, mainContent); wrapper.append(toggleBtn, menuContent); document.body.appendChild(wrapper);

        applyDynamicHover(document.getElementById('btn-lupa'), '#3b82f6');
        applyDynamicHover(document.getElementById('btn-generar-leaderboard'), '#8b5cf6'); 
        applyDynamicHover(document.getElementById('btn-resaltar'), '#10b981'); 
        applyDynamicHover(document.getElementById('btn-limpiar'), '#ef4444'); 

        makeDraggable(wrapper, document.getElementById('panel-drag-handle'));
        asignarLogicaPlanilla();
    }

    const asignarLogicaPlanilla = () => {
        const slot = document.getElementById('txt-cuentas-slot'); const sideInput = document.getElementById('txt-cuentas-side'); const sidePanel = document.getElementById('panel-lateral-cuentas');
        
        const adjustHeight = (textarea) => {
            textarea.style.height = '1px'; 
            const maxHeightAllowed = window.innerHeight - 80; const realHeight = textarea.scrollHeight;
            if (realHeight > maxHeightAllowed) { textarea.style.height = maxHeightAllowed + 'px'; textarea.style.overflowY = 'auto'; } 
            else { textarea.style.height = Math.max(80, realHeight) + 'px'; textarea.style.overflowY = 'hidden'; }
        };

        document.getElementById('btn-lupa').addEventListener('click', () => { 
            const isOpening = sidePanel.style.display !== 'flex'; sidePanel.style.display = isOpening ? 'flex' : 'none'; 
            if (isOpening) setTimeout(() => adjustHeight(sideInput), 10);
        });
        document.getElementById('btn-cerrar-side').addEventListener('click', () => { sidePanel.style.display = 'none'; });
        slot.addEventListener('input', () => { sideInput.value = slot.value; if (sidePanel.style.display === 'flex') adjustHeight(sideInput); });
        sideInput.addEventListener('input', function() { slot.value = sideInput.value; adjustHeight(this); });

        let isUserInteracting = false;
        slot.addEventListener('mouseenter', () => isUserInteracting = true); slot.addEventListener('mouseleave', () => isUserInteracting = false);
        slot.addEventListener('focus', () => { isUserInteracting = true; slot.style.textAlign = 'left'; }); slot.addEventListener('blur', () => { isUserInteracting = false; slot.style.textAlign = 'center'; });
        
        window._planillaSlotTracker = setInterval(() => {
            if (!isUserInteracting && slot.value.trim() !== '') {
                slot.scrollTop += 1; if (slot.scrollTop + slot.clientHeight >= slot.scrollHeight - 1) slot.scrollTop = 0;
            }
        }, 35); 

        let isPaintMode = false; let paintColor = 'amarillo'; 
        const btnTogglePaint = document.getElementById('btn-toggle-paint'), btnSwitchColor = document.getElementById('btn-switch-color'), containerPaint = document.getElementById('pincel-container');

        containerPaint.onmouseenter = () => {
            if (!isPaintMode) { containerPaint.style.background = 'rgba(59,130,246,0.8)'; containerPaint.style.borderColor = '#3b82f6'; containerPaint.style.boxShadow = '0 2px 10px rgba(59,130,246,0.6)'; } 
            else { const bg = paintColor === 'amarillo' ? 'rgba(255,255,0,0.6)' : 'rgba(255,51,51,0.6)'; const bBorder = paintColor === 'amarillo' ? 'rgba(255,255,0,0.8)' : 'rgba(255,51,51,0.8)'; containerPaint.style.background = bg; containerPaint.style.borderColor = bBorder; containerPaint.style.boxShadow = `0 2px 10px ${bBorder}`; }
        };
        containerPaint.onmouseleave = () => {
            if (!isPaintMode) { containerPaint.style.background = 'rgba(0,0,0,0.3)'; containerPaint.style.borderColor = 'rgba(255,255,255,0.15)'; containerPaint.style.boxShadow = 'none'; } 
            else { const bg = paintColor === 'amarillo' ? 'rgba(255,255,0,0.3)' : 'rgba(255,51,51,0.3)'; const bBorder = paintColor === 'amarillo' ? 'rgba(255,255,0,0.5)' : 'rgba(255,51,51,0.5)'; containerPaint.style.background = bg; containerPaint.style.borderColor = bBorder; containerPaint.style.boxShadow = 'none'; }
        };

        btnTogglePaint.addEventListener('click', function() {
            isPaintMode = !isPaintMode;
            if (isPaintMode) {
                btnTogglePaint.innerText = '🖌️ ON'; btnSwitchColor.style.display = 'block'; btnTogglePaint.style.background = 'transparent';
                containerPaint.style.background = paintColor === 'amarillo' ? 'rgba(255,255,0,0.6)' : 'rgba(255,51,51,0.6)';
                containerPaint.style.borderColor = paintColor === 'amarillo' ? 'rgba(255,255,0,0.8)' : 'rgba(255,51,51,0.8)';
                document.body.classList.add('pintura-activa'); showNotification('Pincel Activado', 3000, 'info');
            } else {
                btnTogglePaint.innerText = '🖌️ OFF'; btnSwitchColor.style.display = 'none'; containerPaint.style.background = 'rgba(59,130,246,0.8)';
                containerPaint.style.borderColor = '#3b82f6'; document.body.classList.remove('pintura-activa'); showNotification('Pincel Desactivado', 3000, 'info');
            }
        });

        btnSwitchColor.addEventListener('click', function() {
            paintColor = paintColor === 'amarillo' ? 'rojo' : 'amarillo'; btnSwitchColor.innerText = paintColor === 'amarillo' ? '🟡' : '🔴';
            if (isPaintMode) { containerPaint.style.background = paintColor === 'amarillo' ? 'rgba(255,255,0,0.6)' : 'rgba(255,51,51,0.6)'; containerPaint.style.borderColor = paintColor === 'amarillo' ? 'rgba(255,255,0,0.8)' : 'rgba(255,51,51,0.8)'; }
        });

        // Evento Global para Pintar (Debemos removerlo al cambiar de vista para que no se duplique)
        const paintHandler = function(e) {
            if (!isPaintMode) return;
            let td = e.target.closest('td'); if (!td || !td.closest('.el-table__body')) return; 
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('.el-checkbox')) return;
            e.preventDefault(); e.stopPropagation();
            let claseAplicar = paintColor === 'amarillo' ? 'manual-amarillo' : 'manual-rojo'; let claseRemover = paintColor === 'amarillo' ? 'manual-rojo' : 'manual-amarillo';
            let row = td.closest('tr'); const sufijos = obtenerSufijosDinamicos(); let cellCuenta = null;
            if (sufijos.cuenta) row.querySelectorAll('td').forEach(c => { if (c.className.includes(sufijos.cuenta)) cellCuenta = c; });

            if (td.classList.contains(claseAplicar)) { td.classList.remove(claseAplicar); if (cellCuenta && cellCuenta !== td) cellCuenta.classList.remove(claseAplicar); } 
            else { td.classList.remove(claseRemover); td.classList.add(claseAplicar); if (cellCuenta && cellCuenta !== td) { cellCuenta.classList.remove(claseRemover); cellCuenta.classList.add(claseAplicar); } }
        };
        document.addEventListener('click', paintHandler, true);
        window._planillaPaintHandler = paintHandler; // Lo guardamos para poder limpiarlo después

        document.getElementById('btn-limpiar').addEventListener('click', () => {
            document.querySelectorAll('.resaltado-exacto').forEach(e => e.classList.remove('resaltado-exacto'));
            document.querySelectorAll('.resaltado-gradiente').forEach(e => { e.style.removeProperty('background-color'); e.style.removeProperty('color'); e.classList.remove('resaltado-gradiente'); });
            document.querySelectorAll('.manual-amarillo').forEach(e => e.classList.remove('manual-amarillo'));
            document.querySelectorAll('.manual-rojo').forEach(e => e.classList.remove('manual-rojo'));
            showNotification('Limpieza completada', 3000, 'success');
        });

        document.getElementById('btn-resaltar').addEventListener('click', () => {
            if (isPaintMode) btnTogglePaint.click(); document.getElementById('btn-limpiar').click();
            const sufijos = obtenerSufijosDinamicos(); if (!sufijos.cuenta) return showNotification("Error leyendo encabezados.", 3000, "error");

            const rawLines = getCuentasBuscadas(); const cuentasBuscadas = rawLines.map(linea => { const partes = linea.trim().split(/\s+/); return partes.length >= 2 ? partes[1] : partes[0]; });
            const chkSeg = document.getElementById('chk-seg').checked; const inputSegText = document.getElementById('input-seg').value; const inputSeg = inputSegText === '' ? NaN : parseFloat(inputSegText);
            const chkPagos = document.getElementById('chk-pagos').checked; const inputPagosText = document.getElementById('input-pagos').value; const inputPagos = inputPagosText === '' ? NaN : parseFloat(inputPagosText);
            const chkMonto = document.getElementById('chk-monto').checked; const chkRend = document.getElementById('chk-rend').checked;

            const rows = document.querySelectorAll('.el-table__row'); let filasValidas = []; let minRend = Infinity, maxRend = -Infinity, minPagos = Infinity, maxPagos = -Infinity, minMonto = Infinity, maxMonto = -Infinity;

            rows.forEach(row => {
                const cells = row.querySelectorAll('td'); let cellCuenta, cellSeg, cellPagos, cellMonto, cellRend, textoCuenta = "";
                cells.forEach(c => {
                    const className = c.className;
                    if (sufijos.cuenta && className.includes(sufijos.cuenta)) { cellCuenta = c; textoCuenta = (c.innerText || c.textContent).trim(); }
                    if (sufijos.seg && className.includes(sufijos.seg)) cellSeg = c;
                    if (sufijos.pagos && className.includes(sufijos.pagos)) cellPagos = c;
                    if (sufijos.monto && className.includes(sufijos.monto)) cellMonto = c;
                    if (sufijos.rend && className.includes(sufijos.rend)) cellRend = c;
                });

                if ((cuentasBuscadas.length > 0 && !cuentasBuscadas.includes(textoCuenta)) || !textoCuenta) return;
                let numSeg = cellSeg ? parseNumberFromCell(cellSeg) : 0, numPagos = cellPagos ? parseNumberFromCell(cellPagos) : 0, numMonto = cellMonto ? parseNumberFromCell(cellMonto) : 0, numRend = cellRend ? parseNumberFromCell(cellRend) : 0;
                let filaAprobada = true;
                if (chkSeg && !isNaN(inputSeg) && numSeg >= inputSeg) filaAprobada = false;
                if (chkPagos && !isNaN(inputPagos) && numPagos >= inputPagos) filaAprobada = false;

                if (filaAprobada) {
                    filasValidas.push({ row, cellCuenta, cellSeg, cellPagos, cellMonto, cellRend, numRend, numPagos, numMonto });
                    if (numRend < minRend) minRend = numRend; if (numRend > maxRend) maxRend = numRend;
                    if (numPagos < minPagos) minPagos = numPagos; if (numPagos > maxPagos) maxPagos = numPagos;
                    if (numMonto < minMonto) minMonto = numMonto; if (numMonto > maxMonto) maxMonto = numMonto;
                }
            });

            if (minRend === maxRend || minRend === Infinity) minRend = 0; if (minPagos === maxPagos || minPagos === Infinity) minPagos = 0; if (minMonto === maxMonto || minMonto === Infinity) minMonto = 0;
            let isAnyFilterActive = chkSeg || chkPagos || chkMonto || chkRend;

            filasValidas.forEach(data => {
                if (isAnyFilterActive) {
                    if (data.cellCuenta) data.cellCuenta.classList.add('resaltado-exacto');
                    if (chkSeg && data.cellSeg) data.cellSeg.classList.add('resaltado-exacto');
                    if (chkPagos && data.cellPagos) { let p = (maxPagos === minPagos) ? 0.5 : (data.numPagos - minPagos) / (maxPagos - minPagos); data.cellPagos.style.setProperty('background-color', getGradientColor(p * 100), 'important'); data.cellPagos.style.setProperty('color', '#000000', 'important'); data.cellPagos.classList.add('resaltado-gradiente'); }
                    if (chkMonto && data.cellMonto) { let p = (maxMonto === minMonto) ? 0.5 : (data.numMonto - minMonto) / (maxMonto - minMonto); data.cellMonto.style.setProperty('background-color', getGradientColor(p * 100), 'important'); data.cellMonto.style.setProperty('color', '#000000', 'important'); data.cellMonto.classList.add('resaltado-gradiente'); }
                    if (chkRend && data.cellRend) { let p = (maxRend === minRend) ? 0.5 : (data.numRend - minRend) / (maxRend - minRend); data.cellRend.style.setProperty('background-color', getGradientColor(p * 100), 'important'); data.cellRend.style.setProperty('color', '#000000', 'important'); data.cellRend.classList.add('resaltado-gradiente'); }
                } else { data.row.classList.add('resaltado-exacto'); }
            });
            showNotification(`Procesado: ${filasValidas.length} cuentas`, 3000, 'success');
        });

        document.getElementById('btn-generar-leaderboard').addEventListener('click', () => {
            const rawLines = getCuentasBuscadas(); if (rawLines.length === 0) return showNotification("Pega cuentas en la lupa primero.", 3000, "warning");
            let sufijos = { cuenta: null, casos: null, seg: null, pagos: null, monto: null, rend: null };
            const headers = document.querySelectorAll('.el-table__header-wrapper th, .el-table__fixed-header-wrapper th');
            headers.forEach(th => {
                const text = (th.innerText || th.textContent).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const match = th.className.match(/_column_\d+/); if (!match) return; const suffix = match[0];
                if (text.includes('cuenta de cobra') || text.includes('cuenta')) sufijos.cuenta = suffix;
                else if (text.includes('ordenes de seguimiento') || text.includes('órdenes de seguimiento')) sufijos.casos = suffix;
                else if (text.includes('numero de segui')) sufijos.seg = suffix;
                else if (text.includes('cobros completados') || text.includes('pago completo')) { if (!text.includes('tasa')) sufijos.pagos = suffix; } 
                else if (text.includes('monto de cobra')) sufijos.monto = suffix;
                else if (text.includes('tasa de recuperaci') || text.includes('tasa de recu')) sufijos.rend = suffix;
            });
            if (!sufijos.cuenta) return showNotification("Mueve el scroll para leer encabezados.", 3000, "error");

            const busquedas = rawLines.map(linea => { const partes = linea.trim().split(/\s+/); if (partes.length >= 2) return { id: partes[0], cuenta: partes[1] }; if (partes.length === 1 && partes[0] !== '') return { id: '-', cuenta: partes[0] }; return null; }).filter(Boolean);
            const cuentasLista = busquedas.map(b => b.cuenta); let dataDict = {}; let maxPagos = -Infinity, minPagos = Infinity, maxRend = -Infinity, minRend = Infinity, maxMonto = -Infinity, minMonto = Infinity;

            document.querySelectorAll('.el-table__row').forEach(row => {
                const cells = row.querySelectorAll('td'); let cuenta = "", casos = "0", seg = "0", pagos = "0", montoText = "0", rendText = "0%"; let pagosVal = 0, rendVal = 0, montoVal = 0;
                cells.forEach(c => {
                    const className = c.className, text = (c.innerText || c.textContent).trim();
                    if (sufijos.cuenta && className.includes(sufijos.cuenta)) cuenta = text;
                    if (sufijos.casos && className.includes(sufijos.casos)) casos = text;
                    if (sufijos.seg && className.includes(sufijos.seg)) seg = text;
                    if (sufijos.pagos && className.includes(sufijos.pagos)) { pagos = text; pagosVal = parseNumberFromCell(c); }
                    if (sufijos.monto && className.includes(sufijos.monto)) { montoText = text; montoVal = parseNumberFromCell(c); }
                    if (sufijos.rend && className.includes(sufijos.rend)) { rendText = text; rendVal = parseNumberFromCell(c); }
                });
                if (cuenta && cuentasLista.includes(cuenta) && !dataDict[cuenta]) {
                    const idOriginal = busquedas.find(b => b.cuenta === cuenta).id;
                    dataDict[cuenta] = { id: idOriginal, cuenta: cuenta, casos: casos, seg: seg, pagos: pagos, monto: montoText, rendText: rendText, rendVal: rendVal, pagosVal: pagosVal, montoVal: montoVal };
                    if (rendVal > maxRend) maxRend = rendVal; if (rendVal < minRend) minRend = rendVal;
                    if (pagosVal > maxPagos) maxPagos = pagosVal; if (pagosVal < minPagos) minPagos = pagosVal;
                    if (montoVal > maxMonto) maxMonto = montoVal; if (montoVal < minMonto) minMonto = montoVal;
                }
            });

            let dataExtraida = Object.values(dataDict); if(dataExtraida.length === 0) return showNotification("Cuentas no encontradas.", 3000, "error");
            if (maxRend === minRend || minRend === Infinity) minRend = 0; if (maxPagos === minPagos || minPagos === Infinity) minPagos = 0; if (maxMonto === minMonto || minMonto === Infinity) minMonto = 0;
            dataExtraida.sort((a, b) => b.rendVal - a.rendVal);

            let repPanel = document.getElementById('visor-flotante-reporte'); if (repPanel) repPanel.remove(); 
            repPanel = document.createElement('div'); repPanel.id = 'visor-flotante-reporte';
            Object.assign(repPanel.style, { position: 'fixed', width: '650px', left: 'calc(50vw - 325px)', top: '10vh', backgroundColor: '#ffffff', borderRadius: '8px', zIndex: '999999', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', overflow: 'hidden', fontFamily: 'Arial, sans-serif' });
            document.body.appendChild(repPanel);

            let htmlTabla = `<div id="rep-scroll-area" style="max-height: 75vh; overflow-y: auto; background: #fff;"><div style="background: #fff; border-radius: 8px 8px 0 0;"><div id="rep-header" class="drag-header" style="background: #a32020; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #7a1515;"><h3 style="margin:0; font-size: 16px; letter-spacing: 1.5px; text-transform: uppercase;">REPORTE ACTUAL</h3><div style="display:flex; gap: 15px; align-items: center;"><label style="font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: bold;"><input type="checkbox" id="switch-pagos-monto" checked style="cursor: pointer;"> 🎨 Pagos/Monto</label><label style="font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: bold;"><input type="checkbox" id="switch-rend" checked style="cursor: pointer;"> 🎨 Rendim.</label></div><button id="btn-cerrar-rep" style="background: none; border: none; color: white; font-size: 22px; cursor: pointer; line-height: 1;">&times;</button></div><div style="padding: 0;"><div id="zona-captura-tabla" style="background: #ffffff; padding: 5px;"><table id="tabla-exportar" style="width: 100%; border-collapse: collapse; text-align: center; color: #000000; font-size: 13px;"><thead><tr style="border-bottom: 2px solid #e5e7eb; background: #f8fafc;"><th style="padding: 12px 6px; color: #000; font-weight: bold;">#</th><th style="padding: 12px 6px; color: #000; font-weight: bold;">ID</th><th style="padding: 12px 6px; color: #000; font-weight: bold;">CUENTA</th><th style="padding: 12px 6px; color: #000; font-weight: bold;">CASOS</th><th style="padding: 12px 6px; color: #000; font-weight: bold;">SEGUIM.</th><th style="padding: 12px 6px; color: #000; font-weight: bold;">PAGOS</th><th style="padding: 12px 6px; color: #000; font-weight: bold;">RENDIMIENTO %</th><th style="padding: 12px 6px; color: #000; font-weight: bold;">MONTO COBRANZA</th></tr></thead><tbody>`;

            dataExtraida.forEach((item, index) => {
                let colorRend = getGradientColor(((maxRend === minRend) ? 0.5 : (item.rendVal - minRend) / (maxRend - minRend)) * 100);
                let colorPagos = getGradientColor(((maxPagos === minPagos) ? 0.5 : (item.pagosVal - minPagos) / (maxPagos - minPagos)) * 100);
                let colorMonto = getGradientColor(((maxMonto === minMonto) ? 0.5 : (item.montoVal - minMonto) / (maxMonto - minMonto)) * 100);
                htmlTabla += `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px 6px; color: #000000; font-weight: bold;">${index + 1}</td><td style="padding: 8px 6px; color: #000000; font-weight: bold;">${item.id}</td><td style="padding: 8px 6px; color: #000000;">${item.cuenta}</td><td style="padding: 8px 6px; color: #000000;">${item.casos}</td><td style="padding: 8px 6px; color: #000000;">${item.seg}</td><td class="cell-pagos-monto" data-color="${colorPagos}" style="padding: 8px 6px; color: #000000; background-color: ${colorPagos}; font-weight: bold;">${item.pagos}</td><td class="cell-rendimiento" data-color="${colorRend}" style="padding: 8px 6px; color: #000000; background-color: ${colorRend}; font-weight: bold;">${item.rendText}</td><td class="cell-pagos-monto" data-color="${colorMonto}" style="padding: 8px 6px; color: #000000; background-color: ${colorMonto}; font-weight: bold;">${item.monto}</td></tr>`;
            });

            htmlTabla += `</tbody></table></div></div></div></div><div style="display: flex;"><button id="btn-excel-rep" class="btn-lb btn-excel" style="flex: 1; padding: 12px; border: none; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 13px; color: white; background-color: #217346;">📊 Excel</button><button id="btn-img-rep" class="btn-lb btn-img" style="flex: 1; padding: 12px; border: none; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 13px; color: white; background-color: #a32020;">📸 Imagen</button></div>`;
            repPanel.innerHTML = htmlTabla; makeDraggable(repPanel, document.getElementById('rep-header')); document.getElementById('btn-cerrar-rep').addEventListener('click', () => repPanel.remove()); showNotification('Reporte generado', 3000, 'success');

            document.getElementById('switch-pagos-monto').addEventListener('change', function() { const isChecked = this.checked; document.querySelectorAll('.cell-pagos-monto').forEach(td => { td.style.backgroundColor = isChecked ? td.getAttribute('data-color') : 'transparent'; }); });
            document.getElementById('switch-rend').addEventListener('change', function() { const isChecked = this.checked; document.querySelectorAll('.cell-rendimiento').forEach(td => { td.style.backgroundColor = isChecked ? td.getAttribute('data-color') : 'transparent'; }); });

            document.getElementById('btn-excel-rep').addEventListener('click', function() {
                const range = document.createRange(); range.selectNode(document.getElementById('tabla-exportar')); window.getSelection().removeAllRanges(); window.getSelection().addRange(range);
                try { document.execCommand('copy'); showNotification('Copiado para Excel', 3000, 'success'); } catch(err) { showNotification('Error al copiar', 3000, 'error'); } window.getSelection().removeAllRanges();
            });

            document.getElementById('btn-img-rep').addEventListener('click', function() {
                const captureArea = document.getElementById('zona-captura-tabla'); const scrollArea = document.getElementById('rep-scroll-area');
                const origMaxHeight = scrollArea.style.maxHeight; const origOverflow = scrollArea.style.overflowY;
                scrollArea.style.maxHeight = 'none'; scrollArea.style.overflowY = 'visible'; showNotification('Generando imagen...', 2000, 'info');

                function takeShot() {
                    html2canvas(captureArea, { backgroundColor: "#ffffff", scale: 3, logging: false, useCORS: true, allowTaint: true, imageTimeout: 0, onclone: (clonedDoc) => { const table = clonedDoc.getElementById('tabla-exportar'); if(table) table.style.color = "#000000"; }
                    }).then(canvas => {
                        scrollArea.style.maxHeight = origMaxHeight; scrollArea.style.overflowY = origOverflow; 
                        canvas.toBlob(blob => {
                            if (!blob) return;
                            try { const item = new ClipboardItem({ 'image/png': blob }); navigator.clipboard.write([item]).then(() => { showNotification("✅ Imagen Copiada", 3000, "success"); }).catch(err => { showNotification("Navegador bloqueó copiado. Usa Win+Shift+S.", 4000, "warning"); }); } 
                            catch (err) { showNotification("Tu navegador no soporta copiado directo.", 4000, "error"); }
                        });
                    }).catch(err => { scrollArea.style.maxHeight = origMaxHeight; scrollArea.style.overflowY = origOverflow; console.error(err); });
                }
                
                if (typeof html2canvas === 'undefined') { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; document.head.appendChild(script); script.onload = takeShot; } 
                else { takeShot(); }
            });
        });
    };

    // ==========================================
    // 5. ENRUTADOR INTELIGENTE (ROUTER SPA)
    // ==========================================
    function cleanUpUI() {
        // Limpiamos los paneles
        document.querySelectorAll('.addon-panel-independent, #wrapper-panel-crm, #visor-flotante-reporte, .addon-aviso-temp').forEach(el => el.remove());
        // Limpiamos los intervalos y eventos globales para que no pesen en memoria
        if (window._gsheetsUserTracker) clearInterval(window._gsheetsUserTracker);
        if (window._planillaSlotTracker) clearInterval(window._planillaSlotTracker);
        if (window._planillaPaintHandler) document.removeEventListener('click', window._planillaPaintHandler, true);
        document.body.classList.remove('pintura-activa');
    }

    function runRouter() {
        const url = window.location.href;
        cleanUpUI(); // Siempre limpiamos antes de renderizar la nueva vista

        if (url.includes('/loaned_management/pedding_list')) {
            setTimeout(buildGSheetsPanel, 1500); // 1.5s de delay para asegurar que la tabla del CRM haya cargado
        } else if (url.includes('/loaned_management/urge_performance')) {
            setTimeout(buildPlanillaPanel, 1500);
        }
    }

    // Inicialización
    let currentUrl = location.href;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runRouter);
    } else {
        runRouter();
    }

    // Escuchar cambios de URL en la SPA
    new MutationObserver(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            runRouter();
        }
    }).observe(document, { subtree: true, childList: true });

})();

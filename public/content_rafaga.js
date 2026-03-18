(function() {
    'use strict';

    // ==========================================
    // 1. CONFIGURACIÓN (6 PAÍSES)
    // ==========================================
    const DOMAIN_CONFIG = [
        { prefix: '+57', country: 'Colombia', domains: ['https://co-crm.certislink.com'], digits: 10 },
        { prefix: '+52', country: 'México (Cashimex)', domains: ['https://mx-crm.certislink.com'], digits: 10 },
        { prefix: '+52', country: 'México (Various)', domains: ['https://mx-ins-crm.variousplan.com'], digits: 10 },
        { prefix: '+56', country: 'Chile', domains: ['https://cl-crm.certislink.com'], digits: 9 },
        { prefix: '+51', country: 'Perú', domains: ['https://pe-crm.certislink.com'], digits: 9 },
        { prefix: '+55', country: 'Brasil', domains: ['https://crm.creddireto.com'], digits: 11 },
        { prefix: '+54', country: 'Argentina', domains: ['https://crm.rayodinero.com'], digits: 10 }
    ];

    // --- ESTILOS CSS GLOBALES ---
    const inyectarEstilos = () => {
        if (document.getElementById('estilos-rafaga')) return;
        const style = document.createElement('style');
        style.id = 'estilos-rafaga';
        style.innerHTML = `
            #tabla-container-rafaga::-webkit-scrollbar { height: 10px; width: 10px; }
            #tabla-container-rafaga::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.7); border-radius: 8px; margin: 4px; }
            #tabla-container-rafaga::-webkit-scrollbar-thumb { background: #475569; border-radius: 8px; border: 2px solid rgba(15, 23, 42, 1); }
            #tabla-container-rafaga::-webkit-scrollbar-thumb:hover { background: #64748b; }
            .fila-rafaga:hover { background-color: rgba(51, 65, 85, 0.7); transition: background-color 0.2s; }
            
            .btn-rafaga { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: bold; padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; }
            .btn-rafaga:active { transform: scale(0.95) !important; }
            .btn-rafaga:disabled { opacity: 0.6; cursor: wait; transform: none !important; box-shadow: none !important; }

            .btn-red { background: #ef4444; color: white; }
            .btn-red:hover:not(:disabled) { background: #f87171; box-shadow: 0 0 12px #ef4444, 0 0 20px #ef4444; transform: translateY(-2px); }
            .btn-orange { background: #f59e0b; color: white; }
            .btn-orange:hover:not(:disabled) { background: #fbbf24; box-shadow: 0 0 12px #f59e0b, 0 0 20px #f59e0b; transform: translateY(-2px); }
            .btn-purple { background: #8b5cf6; color: white; }
            .btn-purple:hover:not(:disabled) { background: #a78bfa; box-shadow: 0 0 12px #8b5cf6, 0 0 20px #8b5cf6; transform: translateY(-2px); }
            .btn-blue { background: #3b82f6; color: white; }
            .btn-blue:hover:not(:disabled) { background: #60a5fa; box-shadow: 0 0 12px #3b82f6, 0 0 20px #3b82f6; transform: translateY(-2px); }
            .btn-green { background: #34d399; color: black; }
            .btn-green:hover:not(:disabled) { background: #6ee7b7; box-shadow: 0 0 12px #34d399, 0 0 20px #34d399; transform: translateY(-2px); }
            .btn-yellow { background: #eab308; color: black; }
            .btn-yellow:hover:not(:disabled) { background: #facc15; box-shadow: 0 0 12px #eab308, 0 0 20px #eab308; transform: translateY(-2px); }
            
            /* 🔥 BOTONES DE FILTRO MÚLTIPLE 🔥 */
            .btn-rafaga-toggle { background: #1e293b; color: #cbd5e1; border: 1px solid #475569; border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight:bold; cursor: pointer; transition: 0.2s; outline:none; }
            .btn-rafaga-toggle:hover { background: #334155; }
            .btn-rafaga-toggle.active { background: #8b5cf6; color: white; border-color: #a78bfa; box-shadow: 0 0 8px rgba(139,92,246,0.6); }

            .switch-mora { position: relative; display: inline-block; width: 34px; height: 18px; margin-right: 6px; }
            .switch-mora input { opacity: 0; width: 0; height: 0; }
            .slider-mora { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #475569; transition: .4s; border-radius: 34px; }
            .slider-mora:before { position: absolute; content: ""; height: 12px; width: 12px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider-mora { background-color: #ef4444; box-shadow: 0 0 8px #ef4444; }
            input:checked + .slider-mora:before { transform: translateX(16px); }
            .label-mora { font-size: 11px; font-weight: 800; cursor: pointer; user-select: none; transition: 0.3s; letter-spacing: 0.5px; }
        `;
        document.head.appendChild(style);
    };

    // --- UTILS ---
    const getCountryInfo = () => {
        const href = window.location.href;
        for (const c of DOMAIN_CONFIG) {
            for (const d of c.domains) {
                if (href.startsWith(d)) return { prefix: c.prefix, name: c.country, digits: c.digits };
            }
        }
        return { prefix: '', name: 'Desconocido', digits: 10 };
    };

    const getFechasRelativas = () => {
        const hoy = new Date();
        const formato = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        return { strHoy: formato(hoy), strAyer: formato(ayer) };
    };

    const mostrarAviso = (texto, color = '#60a5fa', tipo = 'info', tiempo = 2000) => {
        if (!document.body) return;
        document.querySelectorAll('.addon-aviso-temp').forEach(e => e.remove());
        const div = document.createElement('div');
        div.className = 'addon-aviso-temp';
        let icono = tipo === 'success' ? '✅' : tipo === 'error' ? '⛔' : tipo === 'warning' ? '⚠️' : 'ℹ️';
        if(tipo==='success') color='#34d399'; if(tipo==='error') color='#f87171'; if(tipo==='warning') color='#fbbf24';
        
        div.innerHTML = `<span style="font-size:15px; margin-right:8px;">${icono}</span><span style="font-weight:600; font-size:13px;">${texto}</span>`;
        Object.assign(div.style, {
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', 
            backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#fff', borderRadius: '30px', 
            zIndex: 2147483647, borderLeft: `3px solid ${color}`, backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        });
        document.body.appendChild(div);
        setTimeout(() => div.remove(), tiempo); 
    };

    // ==========================================
    // 🚀 MOTOR DE EXTRACCIÓN MASIVA VÍA API 
    // ==========================================
    const obtenerTokenAutomatico = () => {
        try {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith('Admin-Token=')) {
                    let rawToken = cookie.substring('Admin-Token='.length);
                    return decodeURIComponent(rawToken);
                }
            }
            return null;
        } catch (e) { return null; }
    };

    async function iniciarExtraccionAPI() {
        const inputToken = document.getElementById('input-token-api');
        if (!inputToken) return;

        const tokenRaw = inputToken.value.trim();
        if (!tokenRaw) return mostrarAviso('⚠️ Por favor, pega el Token primero', '#fbbf24', 'warning');
        
        const token = decodeURIComponent(tokenRaw);
        const baseUrl = window.location.origin; 
        const countryInfo = getCountryInfo(); 
        const isVariousPlan = baseUrl.includes('variousplan.com');
        
        const btn = document.getElementById('btn-extraer-api');
        if (btn) {
            btn.innerText = '⏳ Extrayendo...';
            btn.disabled = true;
        }

        let page = 1;
        const pageSize = 300;
        let totalProcesados = 0;
        let totalPages = 1;
        const maxPagesPerRun = 10;
        let processedPages = 0;
        const maxDetailCallsPerRun = 300;
        let detailCalls = 0;
        
        mostrarAviso(`Iniciando extracción en ${countryInfo.name}...`, '#3b82f6', 'info');

        try {
            while (true) {
                const listUrl = `${baseUrl}/api/manage/urge/task/waitUrgeTaskPage?v=${Date.now()}`;
                const stageId = baseUrl.includes('pe-') || baseUrl.includes('cashiper') ? 4 : 1;
                
                const respList = await fetch(listUrl, {
                    method: 'POST',
                    headers: { 'Authentication': token, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ stageId: stageId, current: page, size: pageSize })
                });

                if (!respList.ok) throw new Error(`Error HTTP: ${respList.status}. Revisa el Token.`);
                
                const jsonList = await respList.json();
                const registros = jsonList?.data?.records || jsonList?.records || [];
                
                if (registros.length === 0) break; 
                if (jsonList?.data?.pages) totalPages = jsonList.data.pages;

                for (const c of registros) {
                    let correo = c.email || "";
                    let telefono = String(c.phone || "");
                    
                    let extension = c.extensionAmount || c.totalExtensionAmount || "";
                    let cargoMora = c.overdueFee || c.penaltyAmount || ""; 
                    let montoPago = c.principal || ""; 

                    if (c.taskId && c.orderId && detailCalls < maxDetailCallsPerRun) {
                        try {
                            const detUrl = `${baseUrl}/api/manage/urge/task/getTaskInfo/${c.taskId}/${c.orderId}?v=${Date.now()}`;
                            const respDet = await fetch(detUrl, {
                                method: 'GET',
                                headers: { 'Authentication': token, 'Accept': 'application/json' }
                            });
                            
                            if (respDet.ok) {
                                const detJson = await respDet.json();
                                if (detJson.data) {
                                    correo = correo || detJson.data.email || "";
                                    telefono = String(telefono || detJson.data.phone || detJson.data.phonePrefix || "");
                                    
                                    if (isVariousPlan) {
                                        const planList = detJson.data.planList || [];
                                        if (planList.length > 0) {
                                            const planDetail = planList[0];
                                            cargoMora = String(planDetail.overdueFee || planDetail.overdueAmount || cargoMora);
                                            montoPago = String(planDetail.repayContractAmount || planDetail.principal || montoPago);
                                        }
                                    } else {
                                         extension = extension || detJson.data.totalExtensionAmount || "";
                                         cargoMora = String(detJson.data.overdueFee || detJson.data.penaltyAmount || cargoMora);
                                         montoPago = String(detJson.data.principal || montoPago);
                                    }
                                }
                            }
                        } catch(e) { console.warn(`Error leyendo detalle de orden ${c.orderId}`); }
                        
                        detailCalls++;
                        await new Promise(r => setTimeout(r, 150)); 
                    }

                    // 🔥 CAMBIO CLAVE PARA VARIOUSPLAN 🔥
                    let idPlanBruto = "";
                    if (isVariousPlan) {
                        idPlanBruto = c.borrowId || c.orderId || "";
                    } else {
                        idPlanBruto = c.repayId || c.orderId || "";
                    }
                    const idPlanStr = String(idPlanBruto);
                    const idPlan = isVariousPlan ? idPlanStr : (idPlanStr.includes('p') ? idPlanStr : 'p' + idPlanStr);

                    const prefixClean = countryInfo.prefix.replace('+', '');
                    const telLimpio = telefono.replace(/[^0-9]/g, '');
                    const telefonoFinal = telLimpio.length >= countryInfo.digits ? 
                                          (prefixClean + telLimpio.slice(-countryInfo.digits)) : 
                                          (prefixClean + telLimpio);

                    let fechaConexion = c.openTime ? String(c.openTime).split(' ')[0] : '';

                    const datos = {
                        idPlan: idPlan,
                        telefono: telefonoFinal,
                        nombre: c.userName || c.name || "",
                        app: c.appName || "",
                        correo: correo,
                        producto: c.productName || "",
                        monto: String(c.repayAmount || c.totalAmount || ""),
                        importeReinv: String(extension),
                        diasMora: String(c.overdueDay || ""),
                        cargoMora: cargoMora,
                        montoPago: montoPago,
                        fechaConexion: fechaConexion 
                    };

                    guardarEnLote(datos);
                    totalProcesados++;
                }

                page++;
                processedPages++;
                await new Promise(r => setTimeout(r, 400));
                if (processedPages >= maxPagesPerRun || page > totalPages) break;
            }

            mostrarAviso(`✅ Ráfaga API completada. ${totalProcesados} registros extraídos.`, '#34d399', 'success');
        } catch (error) {
            mostrarAviso('❌ Error de conexión o Token inválido.', '#ef4444', 'error');
        } finally {
            if (btn) { btn.innerText = '⚡Extraer Todo⚡'; btn.disabled = false; }
        }
    }

    // ==========================================
    // 📊 BASE DE DATOS Y FILTROS MÚLTIPLES
    // ==========================================
    const guardarEnLote = (datos) => {
        let lote = JSON.parse(localStorage.getItem('LOTE_RAFAGA') || '[]');
        
        const indexExistente = lote.findIndex(cliente => cliente.idPlan === datos.idPlan);
        if (indexExistente === -1) {
            lote.push(datos);
            mostrarAviso(`📦 Capturado: ${datos.idPlan}`, '#3b82f6', 'info', 800);
        } else {
            lote[indexExistente] = datos;
            mostrarAviso(`🔄 Actualizado: ${datos.idPlan}`, '#8b5cf6', 'info', 800);
        }
        localStorage.setItem('LOTE_RAFAGA', JSON.stringify(lote)); 
        actualizarPanelFiltroPlus(); 
        actualizarTablaLotes();
    };

    const togglePanelVisibility = (forzarEstado = null) => {
        let isVisible = localStorage.getItem('PANEL_RAFAGA_VISIBLE') === 'true';
        if (forzarEstado !== null) isVisible = forzarEstado;
        else isVisible = !isVisible;
        localStorage.setItem('PANEL_RAFAGA_VISIBLE', isVisible);
        const panel = document.getElementById('panel-excel-rafaga');
        if (panel) panel.style.display = isVisible ? 'flex' : 'none';
    };

    // 🔥 FILTRADO SUMATORIO MÚLTIPLE (LÓGICA OR Y DESCARTA DUPLICADOS) 🔥
    const obtenerLoteFiltrado = () => {
        let loteRaw = JSON.parse(localStorage.getItem('LOTE_RAFAGA') || '[]');
        
        let unicosMap = new Map();
        loteRaw.forEach(c => {
            if (!unicosMap.has(c.idPlan)) unicosMap.set(c.idPlan, c);
        });
        let loteUnicos = Array.from(unicosMap.values());
        
        const botonesApp = document.querySelectorAll('.btn-app-plus.active');
        const appsSeleccionadas = Array.from(botonesApp).map(b => b.dataset.val);

        const botonesFecha = document.querySelectorAll('.btn-fecha-plus.active');
        const fechasSeleccionadas = Array.from(botonesFecha).map(b => b.dataset.val);

        const botonesMora = document.querySelectorAll('.btn-mora-plus.active');
        const morasSeleccionadas = Array.from(botonesMora).map(b => b.dataset.val);

        let filtrado = loteUnicos.filter(c => {
            let matchApp = appsSeleccionadas.length === 0 || appsSeleccionadas.includes(c.app);
            if (!matchApp) return false; 
            
            const tieneFechas = fechasSeleccionadas.length > 0;
            const tieneMoras = morasSeleccionadas.length > 0;
            
            const dMora = c.diasMora ? String(c.diasMora).trim() : '';
            const coincideFecha = fechasSeleccionadas.includes(c.fechaConexion);
            const coincideMora = morasSeleccionadas.includes(dMora);

            if (tieneFechas && tieneMoras) {
                return coincideFecha || coincideMora;
            } else if (tieneFechas) {
                return coincideFecha;
            } else if (tieneMoras) {
                return coincideMora;
            } else {
                return true; 
            }
        });

        filtrado.sort((a, b) => (parseInt(a.diasMora) || 0) - (parseInt(b.diasMora) || 0));
        return filtrado;
    };

    // 🔥 DIBUJA BOTONES DEL FILTRO PLUS 🔥
    const actualizarPanelFiltroPlus = () => {
        let loteRaw = JSON.parse(localStorage.getItem('LOTE_RAFAGA') || '[]');
        let unicosMap = new Map();
        loteRaw.forEach(c => { if (!unicosMap.has(c.idPlan)) unicosMap.set(c.idPlan, c); });
        let lote = Array.from(unicosMap.values());

        const activeApps = Array.from(document.querySelectorAll('.btn-app-plus.active')).map(b => b.dataset.val);
        const activeFechas = Array.from(document.querySelectorAll('.btn-fecha-plus.active')).map(b => b.dataset.val);
        const activeMoras = Array.from(document.querySelectorAll('.btn-mora-plus.active')).map(b => b.dataset.val);

        const appsUnicas = [...new Set(lote.map(c => c.app).filter(Boolean))].sort();
        const fechasUnicas = [...new Set(lote.map(c => c.fechaConexion).filter(Boolean))].sort().reverse();
        const morasUnicas = [...new Set(lote.map(c => c.diasMora ? String(c.diasMora).trim() : '').filter(Boolean))].sort((a,b)=>parseInt(a)-parseInt(b));

        const contApps = document.getElementById('plus-apps-container');
        if (contApps) {
            contApps.innerHTML = appsUnicas.map(a => {
                let isActive = activeApps.includes(a) ? 'active' : '';
                return `<button class="btn-rafaga-toggle btn-app-plus ${isActive}" data-val="${a}">${a}</button>`;
            }).join('');
        }

        const contFechas = document.getElementById('plus-fechas-container');
        if (contFechas) {
            contFechas.innerHTML = fechasUnicas.map(f => {
                let fCorta = f.length > 5 ? f.substring(5) : f;
                let isActive = activeFechas.includes(f) ? 'active' : '';
                return `<button class="btn-rafaga-toggle btn-fecha-plus ${isActive}" data-val="${f}">${fCorta}</button>`;
            }).join('');
        }

        const contMoras = document.getElementById('plus-moras-container');
        if (contMoras) {
            contMoras.innerHTML = morasUnicas.map(m => {
                let isActive = activeMoras.includes(m) ? 'active' : '';
                return `<button class="btn-rafaga-toggle btn-mora-plus ${isActive}" data-val="${m}">Día ${m}</button>`;
            }).join('');
        }

        document.querySelectorAll('.btn-rafaga-toggle').forEach(btn => {
            btn.onclick = function() {
                this.classList.toggle('active');
                actualizarTablaLotes();
            };
        });
    };

    const renderizarPanelLotes = () => {
        inyectarEstilos();
        let panel = document.getElementById('panel-excel-rafaga');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'panel-excel-rafaga';
            
            Object.assign(panel.style, {
                position: 'fixed', top: '10vh', left: '50%', transform: 'translateX(-50%)', 
                width: 'max-content', maxWidth: '96vw', height: 'auto', maxHeight: '80vh', 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#fff', borderRadius: '12px', 
                zIndex: 2147483647, backdropFilter: 'blur(10px)', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', 
                display: 'none', flexDirection: 'column', border: '1px solid #334155', 
                fontFamily: 'system-ui, -apple-system, sans-serif'
            });

            // HEADER PROTEGIDO
            const header = document.createElement('div');
            Object.assign(header.style, {
                padding: '12px 20px', borderBottom: '1px solid #334155', display: 'flex', 
                justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '15px',
                cursor: 'grab', backgroundColor: 'rgba(30, 41, 59, 0.95)', borderRadius: '12px 12px 0 0', userSelect: 'none'
            });
            
            const tokenDetectado = obtenerTokenAutomatico() || "";
            let clicsTitulo = 0;

            header.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px; padding-right: 30px; width: 100%;">
                    <span id="titulo-panel" style="cursor:pointer; white-space:nowrap; user-select:none;">📋 Base de datos</span>
                    <div style="position:relative; flex-grow:1; max-content; max-width: 400px;">
                        <input type="text" id="input-token-api" value="${tokenDetectado}" readonly 
                               style="width: 100%; background: #1e293b; color: #34d399; border: 1px solid #334155; border-radius: 4px; padding: 4px 8px; font-size: 10px; outline: none; font-family: monospace; cursor: default; user-select: none;">
                        <div id="escudo-token" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; cursor:default;"></div>
                    </div>
                    <span style="font-size:11px; font-weight:normal; color:#94a3b8; background:#0f172a; padding:2px 6px; border-radius:4px; user-select:none;">Ctrl+Shift+Z</span>
                </div>
                <button id="btn-cerrar-panel" style="background:none; border:none; color:#f87171; cursor:pointer; font-size:18px; line-height:1;">✖</button>
            `;

            setTimeout(() => {
                const titulo = document.getElementById('titulo-panel');
                const inputToken = document.getElementById('input-token-api');
                const escudo = document.getElementById('escudo-token');

                if (titulo && inputToken) {
                    const bloquear = (e) => { e.preventDefault(); return false; };
                    inputToken.oncopy = bloquear; inputToken.oncut = bloquear; inputToken.oncontextmenu = bloquear;
                    inputToken.onkeydown = (e) => {
                        if ((e.ctrlKey || e.metaKey) && (e.keyCode === 67 || e.keyCode === 65 || e.keyCode === 88)) {
                            e.preventDefault(); return false;
                        }
                    };
                    titulo.onclick = () => {
                        clicsTitulo++;
                        if (clicsTitulo === 5) {
                            const pass = prompt("🔐 Acceso de Administrador para editar Token:");
                            if (pass === "1234") {
                                inputToken.readOnly = false;
                                inputToken.style.background = "#0f172a";
                                inputToken.style.border = "1px solid #34d399";
                                inputToken.style.cursor = "text";
                                inputToken.style.userSelect = "text";
                                if(escudo) escudo.style.display = "none"; 
                                mostrarAviso("🔓 Edición permitida", "#34d399", "success");
                            } else {
                                if (pass !== null) mostrarAviso("❌ Contraseña incorrecta", "#ef4444", "error");
                                clicsTitulo = 0;
                            }
                        }
                    };
                }
            }, 100);
            
            let isDragging = false, offsetX, offsetY;
            header.onmousedown = (e) => {
                if (e.target.id === 'btn-cerrar-panel' || e.target.id === 'input-token-api') return;
                isDragging = true; header.style.cursor = 'grabbing';
                const rect = panel.getBoundingClientRect(); 
                offsetX = e.clientX - rect.left; 
                offsetY = e.clientY - rect.top;
            };
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                panel.style.left = (e.clientX - offsetX) + 'px'; panel.style.top = (e.clientY - offsetY) + 'px';
            });
            document.addEventListener('mouseup', () => { isDragging = false; header.style.cursor = 'grab'; });

            // 🔥 TOOLBAR CON BOTÓN PLUS 🔥
            const toolbar = document.createElement('div');
            Object.assign(toolbar.style, {
                padding: '8px 20px', borderBottom: '1px solid #334155', backgroundColor: 'rgba(15, 23, 42, 0.8)',
                display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', position: 'relative' 
            });

            toolbar.innerHTML = `
                <button id="btn-mas-filtro" style="background: #8b5cf6; color: white; border: 1px solid #7c3aed; border-radius: 4px; padding: 6px 12px; font-size: 13px; font-weight: bold; cursor: pointer; outline: none; box-shadow: 0 0 10px rgba(139, 92, 246, 0.5); transition: 0.3s;">
                    ✨ + Filtros Avanzados
                </button>
                
                <div style="width: 1px; height: 20px; background: #475569; margin: 0 5px;"></div> 
                
                <div style="display:flex; align-items:center; background: rgba(0,0,0,0.3); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                    <label class="switch-mora" title="Cambia qué datos se extraen de la ficha">
                        <input type="checkbox" id="check-modo-mora">
                        <span class="slider-mora"></span>
                    </label>
                    <span class="label-mora" id="text-modo-mora">SIN MORA</span>
                </div>

                <div id="panel-filtro-plus" style="position: absolute; top: 100%; left: 20px; background: rgba(15, 23, 42, 0.98); border: 1px solid #8b5cf6; border-radius: 8px; padding: 15px; z-index: 3000; display: none; flex-direction: column; gap: 15px; min-width: 300px; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                    <div style="display:flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #475569; padding-bottom: 8px;">
                        <span style="font-weight: bold; color: #a78bfa; font-size: 14px;">🎛️ Filtros Múltiples (Sin Duplicados)</span>
                        <span id="btn-cerrar-plus" style="cursor:pointer; color: #f87171; font-size: 16px;">✖</span>
                    </div>
                    
                    <div>
                        <label style="font-size: 12px; color: #cbd5e1; font-weight:bold; display:block; margin-bottom:5px;">📱 Aplicación (Múltiple):</label>
                        <div id="plus-apps-container" style="display:flex; flex-wrap:wrap; gap:6px;"></div>
                    </div>

                    <div>
                        <label style="font-size: 12px; color: #cbd5e1; font-weight:bold; display:block; margin-bottom:5px;">📆 Fechas de Conexión (Múltiple):</label>
                        <div id="plus-fechas-container" style="display:flex; flex-wrap:wrap; gap:6px;"></div>
                    </div>

                    <div>
                        <label style="font-size: 12px; color: #cbd5e1; font-weight:bold; display:block; margin-bottom:5px;">⚠️ Días de Mora (Múltiple):</label>
                        <div id="plus-moras-container" style="display:flex; flex-wrap:wrap; gap:6px;"></div>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                const btnMasFiltro = document.getElementById('btn-mas-filtro');
                const panelPlus = document.getElementById('panel-filtro-plus');
                
                if(btnMasFiltro && panelPlus) {
                    btnMasFiltro.onclick = () => {
                        if(panelPlus.style.display === 'none') {
                            panelPlus.style.display = 'flex';
                            actualizarPanelFiltroPlus(); 
                        } else {
                            panelPlus.style.display = 'none';
                        }
                    };
                    document.getElementById('btn-cerrar-plus').onclick = () => panelPlus.style.display = 'none';
                }
            }, 100);

            const tableContainer = document.createElement('div');
            tableContainer.id = 'tabla-container-rafaga';
            Object.assign(tableContainer.style, { padding: '0', overflow: 'auto', flexGrow: '1', minHeight: '100px', fontSize: '13px' });

            const footer = document.createElement('div');
            Object.assign(footer.style, {
                padding: '12px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between',
                backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: '0 0 12px 12px', flexWrap: 'wrap', gap: '10px'
            });
            
            footer.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <button id="btn-limpiar-lote" class="btn-rafaga btn-red" title="Limpiar Base">🗑️</button>
                    <button id="btn-descargar-contactos" class="btn-rafaga btn-orange" title="Descargar CSV">👥</button>
                    <button id="btn-extraer-api" class="btn-rafaga btn-yellow">⚡Extraer Todo⚡</button>
                </div>
                <div style="display:flex; gap:10px;">
                    <button id="btn-copiar-correos" class="btn-rafaga btn-purple">📧 Correos</button>
                    <button id="btn-copiar-lote" class="btn-rafaga btn-blue">Copy Datos</button>
                </div>
            `;

            panel.appendChild(header); panel.appendChild(toolbar); panel.appendChild(tableContainer); panel.appendChild(footer);
            document.body.appendChild(panel);

            document.getElementById('btn-cerrar-panel').onclick = () => togglePanelVisibility(false);

            const checkMora = document.getElementById('check-modo-mora');
            const textMora = document.getElementById('text-modo-mora');
            const isMoraActive = localStorage.getItem('RAFAGA_MODO_MORA') === 'true';

            checkMora.checked = isMoraActive;
            textMora.innerText = isMoraActive ? 'CON MORA' : 'SIN MORA';
            textMora.style.color = isMoraActive ? '#ef4444' : '#94a3b8';

            checkMora.onchange = (e) => {
                const checked = e.target.checked;
                localStorage.setItem('RAFAGA_MODO_MORA', checked);
                textMora.innerText = checked ? 'CON MORA' : 'SIN MORA';
                textMora.style.color = checked ? '#ef4444' : '#94a3b8';
                actualizarTablaLotes();   
            };

            document.getElementById('btn-limpiar-lote').onclick = () => {
                if(confirm('¿Estás seguro de eliminar todos los datos capturados?')) {
                    localStorage.setItem('LOTE_RAFAGA', '[]');
                    actualizarPanelFiltroPlus();
                    actualizarTablaLotes();
                }
            };

            const btnExtraerApi = document.getElementById('btn-extraer-api');
            if (btnExtraerApi) {
                btnExtraerApi.onclick = (e) => { e.preventDefault(); iniciarExtraccionAPI(); };
            }

            document.getElementById('btn-descargar-contactos').onclick = () => {
                let lote = obtenerLoteFiltrado();
                if (lote.length === 0) return mostrarAviso('No hay contactos', '#fbbf24', 'warning');
                
                const prefijo = prompt("Ingrese un prefijo para los nombres (Ej: CUENTA 1).\nSi no desea prefijo, deje en blanco:", "");
                if (prefijo === null) return; 
                
                let csvContent = "\uFEFFFirst Name,Middle Name,Last Name,Phonetic First Name,Phonetic Middle Name,Phonetic Last Name,Name Prefix,Name Suffix,Nickname,File As,Organization Name,Organization Title,Organization Department,Birthday,Notes,Photo,Labels,E-mail 1 - Label,E-mail 1 - Value,Phone 1 - Label,Phone 1 - Value\n"; 
                
                lote.forEach(c => {
                    let nom = c.nombre ? c.nombre.trim() : '';
                    if (prefijo !== "") nom = `${prefijo} ${nom}`; 
                    nom = nom.replace(/"/g, '""'); 
                    let tel = c.telefono ? c.telefono.replace('+', '').trim() : ''; 
                    let correo = c.correo ? c.correo.trim() : '';
                    csvContent += `"${nom}","","","","","","","","","","","","","","","","","","${correo}","","${tel}"\n`;
                });
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url;
                a.download = `Contactos_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                mostrarAviso('CSV descargado 📥', '#f59e0b', 'success');
            };

            document.getElementById('btn-copiar-lote').onclick = () => {
                let lote = obtenerLoteFiltrado();
                if (lote.length === 0) return mostrarAviso('No hay datos', '#fbbf24', 'warning');
                
                const isMoraActive = localStorage.getItem('RAFAGA_MODO_MORA') === 'true';
                let filas = lote.map(c => {
                    let telLimpio = c.telefono ? String(c.telefono).replace('+', '') : '';
                    let dataFila = [ c.idPlan, telLimpio, c.nombre, c.app, c.correo, c.producto, c.monto, c.importeReinv ];
                    if (isMoraActive) {
                        dataFila.push(c.diasMora || '0', c.cargoMora || '0', c.montoPago || '0');
                    }
                    dataFila.push(c.fechaConexion || ''); // La fecha SIEMPRE va al final
                    return dataFila.join('\t');
                });

                navigator.clipboard.writeText(filas.join('\n')).then(() => {
                    mostrarAviso(`¡${lote.length} clientes únicos copiados!`, '#34d399', 'success');
                });
            };

            document.getElementById('btn-copiar-correos').onclick = () => {
                let lote = obtenerLoteFiltrado(); 
                let correos = lote.map(c => c.correo).filter(c => c && c.trim() !== ''); 
                if (correos.length === 0) return mostrarAviso('No hay correos', '#fbbf24', 'warning');
                navigator.clipboard.writeText(correos.join('\n')).then(() => mostrarAviso(`¡${correos.length} correos copiados!`, '#8b5cf6', 'success'));
            };
        }
        
        panel.style.display = localStorage.getItem('PANEL_RAFAGA_VISIBLE') === 'true' ? 'flex' : 'none';
        actualizarPanelFiltroPlus();
        actualizarTablaLotes();
    };

    const actualizarTablaLotes = () => {
        const container = document.getElementById('tabla-container-rafaga');
        if (!container) return;

        let loteFiltrado = obtenerLoteFiltrado();

        if (loteFiltrado.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#64748b; font-size:14px; min-width: 600px;">No hay datos en la Base o coincidiendo con el filtro.</div>';
            const btnCopy = document.getElementById('btn-copiar-lote');
            if(btnCopy) btnCopy.innerText = `Copy Datos`;
            return;
        }

        const isMoraActive = localStorage.getItem('RAFAGA_MODO_MORA') === 'true';
        const { strHoy, strAyer } = getFechasRelativas();

        let html = `
            <table style="width: max-content; min-width: 100%; text-align:left; border-collapse: collapse; white-space: nowrap;">
                <thead style="position: sticky; top: 0; background-color: rgba(30, 41, 59, 1); z-index: 10;">
                    <tr style="border-bottom: 2px solid #475569; color: #94a3b8;">
                        <th style="padding:10px 15px;">ID Plan</th>
                        <th style="padding:10px 15px;">Teléfono</th>
                        <th style="padding:10px 15px;">Nombre</th>
                        <th style="padding:10px 15px;">App</th>
                        <th style="padding:10px 15px;">Correo</th>
                        <th style="padding:10px 15px;">Producto</th>
                        <th style="padding:10px 15px;">Monto</th>
                        <th style="padding:10px 15px;">Reinv</th>
                        ${isMoraActive ? `
                        <th style="padding:10px 15px;">Días Mora</th>
                        <th style="padding:10px 15px;">Cargo Mora</th>
                        <th style="padding:10px 15px;">Monto Pago</th>
                        ` : ''}
                    </tr>
                </thead>
                <tbody>
        `;

        loteFiltrado.forEach(c => {
            let colorFecha = '#64748b'; 
            if (c.fechaConexion === strHoy) colorFecha = '#34d399'; 
            else if (c.fechaConexion === strAyer) colorFecha = '#fb923c'; 

            html += `
                <tr class="fila-rafaga" style="border-bottom: 1px solid #334155;">
                    <td style="padding:8px 15px; color:#60a5fa; font-weight:500;">${c.idPlan}</td>
                    <td style="padding:8px 15px; color:#e2e8f0;">${c.telefono}</td>
                    <td style="padding:8px 15px; line-height: 1.2;">
                        <div>${c.nombre}</div>
                        ${c.fechaConexion ? `<div style="font-size: 10.5px; color: ${colorFecha}; margin-top: 2px; font-weight: 600;">🕒 ${c.fechaConexion}</div>` : ''}
                    </td>
                    <td style="padding:8px 15px; color:#cbd5e1; font-weight:bold;">${c.app}</td>
                    <td style="padding:8px 15px; color:#93c5fd;">${c.correo}</td>
                    <td style="padding:8px 15px; color:#cbd5e1;">${c.producto}</td>
                    <td style="padding:8px 15px; color:#34d399; font-weight:bold;">${c.monto}</td>
                    <td style="padding:8px 15px; color:#f87171;">${c.importeReinv}</td>
                    ${isMoraActive ? `
                    <td style="padding:8px 15px; color:#fbbf24;">${c.diasMora || '-'}</td>
                    <td style="padding:8px 15px; color:#f87171;">${c.cargoMora || '-'}</td>
                    <td style="padding:8px 15px; color:#34d399; font-weight:bold;">${c.montoPago || '-'}</td>
                    ` : ''}
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
        
        const btnCopy = document.getElementById('btn-copiar-lote');
        if(btnCopy) btnCopy.innerText = `Copy Datos (${loteFiltrado.length})`;
    }; 

    // --- EVENTOS GLOBALES ---
    window.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifierKey = isMac ? e.metaKey : e.ctrlKey;
        if (modifierKey && e.shiftKey && e.code === 'KeyZ') {
            e.preventDefault();
            togglePanelVisibility(); 
        }
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'LOTE_RAFAGA') {
            actualizarPanelFiltroPlus();
            actualizarTablaLotes(); 
        }
        if (e.key === 'PANEL_RAFAGA_VISIBLE') {
            const panel = document.getElementById('panel-excel-rafaga');
            if (panel) panel.style.display = e.newValue === 'true' ? 'flex' : 'none';
        }
        if (e.key === 'RAFAGA_MODO_MORA') {
            const checked = e.newValue === 'true';
            const checkMora = document.getElementById('check-modo-mora');
            const textMora = document.getElementById('text-modo-mora');
            
            if (checkMora && textMora) {
                checkMora.checked = checked;
                textMora.innerText = checked ? 'CON MORA' : 'SIN MORA';
                textMora.style.color = checked ? '#ef4444' : '#94a3b8';
                actualizarTablaLotes();
            }
        }
    });

    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            const isDetail2 = location.href.includes('/detail2');
            const isDetail3 = location.href.includes('/detail3');
            
            if (isDetail2 || isDetail3) {
                const nuevoEstado = isDetail3 ? 'true' : 'false';
                localStorage.setItem('RAFAGA_MODO_MORA', nuevoEstado);
                window.dispatchEvent(new StorageEvent('storage', { key: 'RAFAGA_MODO_MORA', newValue: nuevoEstado }));
            }
        }
    }).observe(document, { subtree: true, childList: true });
    let lastUrl = location.href;

    // INICIO
    (async () => {
        if (localStorage.getItem('PANEL_RAFAGA_VISIBLE') === null) localStorage.setItem('PANEL_RAFAGA_VISIBLE', 'true');
        
        let estadoInicialMora = 'false'; 
        if (window.location.href.includes('/detail3')) estadoInicialMora = 'true';
        else if (window.location.href.includes('/detail2')) estadoInicialMora = 'false';
        else if (localStorage.getItem('RAFAGA_MODO_MORA') !== null) estadoInicialMora = localStorage.getItem('RAFAGA_MODO_MORA');
        
        localStorage.setItem('RAFAGA_MODO_MORA', estadoInicialMora);
        renderizarPanelLotes();
    })();

})();

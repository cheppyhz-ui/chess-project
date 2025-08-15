// =====================================================================
// === SCRIPT.JS FINAL (UI & Interaksi) ================================
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {

    // === ELEMEN DOM ===
    const initialScreen = document.getElementById('initial-screen');
    const gameScreen = document.getElementById('game-screen');
    const btnStartFlow = document.getElementById('btn-start-flow');
    const btnOptionsFlow = document.getElementById('btn-options-flow');
    const btnBackToMenu = document.getElementById('btn-back-to-menu');
    const overlays = document.querySelectorAll('.overlay-container');
    const gameModeOverlay = document.getElementById('game-mode-overlay');
    const colorChoiceOverlay = document.getElementById('color-choice-overlay');
    const optionsOverlay = document.getElementById('options-overlay');
    const promosiOverlay = document.getElementById('promosi-overlay');
    const playerNamesOverlay = document.getElementById('player-names-overlay');
    const btnVsPlayer = document.getElementById('btn-vs-player');
    const btnVsAI = document.getElementById('btn-vs-ai');
    const btnPlayWhite = document.getElementById('btn-play-white');
    const btnPlayBlack = document.getElementById('btn-play-black');
    const btnCloseOptions = document.getElementById('btn-close-options');
    const btnStartPvpGame = document.getElementById('btn-start-pvp-game');
    const inputNamaPutih = document.getElementById('input-nama-putih');
    const inputNamaHitam = document.getElementById('input-nama-hitam');
    const papanElement = document.getElementById('papan-catur');
    const infoGiliranElement = document.getElementById('info-giliran');
    const pilihanPromosi = document.querySelectorAll('.pilihan-bidak img');
    const tombolGameBaru = document.getElementById('tombol-game-baru');
    const daftarRiwayatElement = document.getElementById('daftar-riwayat');
    const areaBidakDimakanPutih = document.getElementById('bidak-dimakan-putih');
    const labelBidakDimakanPutih = document.getElementById('label-bidak-dimakan-putih');
    const areaBidakDimakanHitam = document.getElementById('bidak-dimakan-hitam');
    const labelBidakDimakanHitam = document.getElementById('label-bidak-dimakan-hitam');
    const themeButtons = document.querySelectorAll('.theme-btn');

    // === STATE APLIKASI ===
    let isPemainVsAI = false;
    let playerColor = 'putih';
    let namaPemainPutih = 'Pemain Putih';
    let namaPemainHitam = 'Pemain Hitam';
    let aiWorker;

    // === FUNGSI PENGELOLA TAMPILAN ===
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(screenId)?.classList.remove('hidden');
    }
    function showOverlay(overlayId) {
        document.getElementById(overlayId)?.classList.remove('hidden');
    }
    function hideAllOverlays() {
        overlays.forEach(o => o.classList.add('hidden'));
    }

    // === ALUR PERMAINAN (UI FLOW) ===
    btnStartFlow.addEventListener('click', () => showOverlay('game-mode-overlay'));
    btnOptionsFlow.addEventListener('click', () => showOverlay('options-overlay'));
    btnCloseOptions.addEventListener('click', hideAllOverlays);
    btnBackToMenu.addEventListener('click', () => {
        if (aiWorker) aiWorker.terminate();
        showScreen('initial-screen');
    });
    btnVsPlayer.addEventListener('click', () => { hideAllOverlays(); showOverlay('player-names-overlay'); });
    btnStartPvpGame.addEventListener('click', () => {
        isPemainVsAI = false;
        namaPemainPutih = inputNamaPutih.value.trim() || 'Pemain Putih';
        namaPemainHitam = inputNamaHitam.value.trim() || 'Pemain Hitam';
        startGame();
    });
    btnVsAI.addEventListener('click', () => {
        isPemainVsAI = true;
        hideAllOverlays();
        showOverlay('color-choice-overlay');
    });
    btnPlayWhite.addEventListener('click', () => {
        playerColor = 'putih';
        namaPemainPutih = 'Pemain';
        namaPemainHitam = 'AI Cerdas';
        startGame();
    });
    btnPlayBlack.addEventListener('click', () => {
        playerColor = 'hitam';
        namaPemainPutih = 'AI Cerdas';
        namaPemainHitam = 'Pemain';
        startGame();
    });
    function startGame() {
        hideAllOverlays();
        showScreen('game-screen');
        mulaiGameBaru();
    }
    tombolGameBaru.addEventListener('click', () => {
         if (aiWorker) aiWorker.terminate();
         showOverlay('game-mode-overlay');
    });

    // === LOGIKA TEMA ===
    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        themeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === themeName));
        localStorage.setItem('chessTheme', themeName);
    }
    themeButtons.forEach(button => button.addEventListener('click', () => applyTheme(button.dataset.theme)));
    const savedTheme = localStorage.getItem('chessTheme') || 'default';
    applyTheme(savedTheme);


    // =====================================================================
    // === KODE LOGIKA GAME CATUR (UI & Interaksi) =========================
    // =====================================================================
    
    let papanSekarang, kotakTerpilih, gerakanSah, giliranSekarang, isGameOver, pionUntukPromosi, statusGerakan, riwayatGerakan, bidakDimakan;
    
    const KEDALAMAN_PENCARIAN = 3;
    const KEDALAMAN_QUIESCENCE = 3;

    const papanAwal = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '], [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '], [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    const pathGambarBidak = {
        'r': 'images/rook-b.png', 'n': 'images/knight-b.png', 'b': 'images/bishop-b.png', 'q': 'images/queen-b.png', 'k': 'images/king-b.png', 'p': 'images/pawn-b.png',
        'R': 'images/rook-w.png', 'N': 'images/knight-w.png', 'B': 'images/bishop-w.png', 'Q': 'images/queen-w.png', 'K': 'images/king-w.png', 'P': 'images/pawn-w.png'
    };
    const simbolBidakTeks = { 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟︎', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙' };
    
    function buatGerakanAI() {
        if (isGameOver) return;
        updateInfoGiliran("AI sedang berpikir...");
        papanElement.classList.add('papan-sibuk');
        if (aiWorker) aiWorker.terminate();
        aiWorker = new Worker('./ai-worker.js');
        aiWorker.postMessage({
            papan: papanSekarang,
            warnaAI: giliranSekarang,
            kedalaman: KEDALAMAN_PENCARIAN,
            quiescence: KEDALAMAN_QUIESCENCE,
            status: statusGerakan
        });
        aiWorker.onmessage = function(e) {
            papanElement.classList.remove('papan-sibuk');
            const gerakanAI = e.data;
            if (gerakanAI) {
                pindahkanBidak(gerakanAI.asal[0], gerakanAI.asal[1], gerakanAI.tujuan[0], gerakanAI.tujuan[1]);
            } else {
                console.log("AI tidak menemukan gerakan!");
            }
            aiWorker.terminate();
            aiWorker = null;
        };
    }

    function mulaiGameBaru() {
        papanSekarang = papanAwal.map(b => b.slice());
        kotakTerpilih = null; gerakanSah = []; giliranSekarang = 'putih'; isGameOver = false; pionUntukPromosi = null;
        statusGerakan = { K: false, R_a1: false, R_h1: false, k: false, r_a8: false, r_h8: false };
        riwayatGerakan = []; bidakDimakan = { putih: [], hitam: [] };
        hideAllOverlays();
        labelBidakDimakanPutih.textContent = `${namaPemainPutih} (Putih)`;
        labelBidakDimakanHitam.textContent = `${namaPemainHitam} (Hitam)`;
        updateInfoGiliran(); 
        updateTampilanSetelahGerakan();
        if (isPemainVsAI && giliranSekarang !== playerColor) {
            buatGerakanAI();
        }
    }
    
    function renderPapan() {
        papanElement.innerHTML = '';
        const papanDibalik = isPemainVsAI && playerColor === 'hitam';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const baris = papanDibalik ? 7 - i : i;
                const kolom = papanDibalik ? 7 - j : j;
                const kotak = document.createElement('div');
                const isGelap = (baris + kolom) % 2 !== 0;
                kotak.classList.add('kotak', isGelap ? 'gelap' : 'terang');
                const bidak = papanSekarang[baris][kolom];
                if (bidak !== ' ') {
                    const imgBidak = document.createElement('img');
                    imgBidak.src = pathGambarBidak[bidak];
                    imgBidak.alt = bidak;
                    kotak.appendChild(imgBidak);
                }
                kotak.addEventListener('click', () => handleKotakClick(baris, kolom));
                papanElement.appendChild(kotak);
            }
        }
    }

    function updateTampilanSetelahGerakan() {
        renderPapan();
        renderRiwayat();
        renderBidakDimakan();
        if (!isGameOver && isRajaSkak(giliranSekarang, papanSekarang, statusGerakan)) {
            const simbolRaja = giliranSekarang === 'putih' ? 'K' : 'k';
            for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
                if (papanSekarang[i][j] === simbolRaja) {
                    const papanDibalik = isPemainVsAI && playerColor === 'hitam';
                    const idx = papanDibalik ? (7 - i) * 8 + (7 - j) : i * 8 + j;
                    if (papanElement.children[idx]) {
                        papanElement.children[idx].classList.add('skak');
                    }
                }
            }
        }
    }

    function renderBidakDimakan() {
        areaBidakDimakanPutih.innerHTML = '';
        areaBidakDimakanHitam.innerHTML = '';
        if (!bidakDimakan) return;
        bidakDimakan.putih.forEach(bidak => {
            const img = document.createElement('img');
            img.src = pathGambarBidak[bidak];
            areaBidakDimakanPutih.appendChild(img);
        });
        bidakDimakan.hitam.forEach(bidak => {
            const img = document.createElement('img');
            img.src = pathGambarBidak[bidak];
            areaBidakDimakanHitam.appendChild(img);
        });
    }

    function renderRiwayat() {
        daftarRiwayatElement.innerHTML = '';
        if (!riwayatGerakan) return;
        for (let i = 0; i < riwayatGerakan.length; i += 2) {
            const noGerakan = (i / 2) + 1;
            const gerakanPutih = riwayatGerakan[i];
            const gerakanHitam = riwayatGerakan[i + 1] || '';
            const itemRiwayat = document.createElement('li');
            itemRiwayat.innerHTML = `<span>${noGerakan}.</span> <span>${gerakanPutih}</span> <span>${gerakanHitam}</span>`;
            daftarRiwayatElement.appendChild(itemRiwayat);
        }
        daftarRiwayatElement.scrollTop = daftarRiwayatElement.scrollHeight;
    }

    function updateInfoGiliran(pesan) {
        if (!infoGiliranElement) return;
        if (pesan) {
            infoGiliranElement.textContent = pesan;
        } else if (!isGameOver) {
            const namaPemain = giliranSekarang === 'putih' ? namaPemainPutih : namaPemainHitam;
            infoGiliranElement.textContent = `Giliran: ${namaPemain}`;
        }
    }

    function resetSorotan() {
        document.querySelectorAll('.kotak').forEach(k => k.classList.remove('terpilih', 'gerakan-sah', 'skak'));
        gerakanSah = [];
        kotakTerpilih = null;
    }

    function selesaikanGiliran() {
        giliranSekarang = (giliranSekarang === 'putih') ? 'hitam' : 'putih';
        updateInfoGiliran();
        if (!periksaAkhirPermainan()) {
            if (isPemainVsAI && giliranSekarang !== playerColor) {
                buatGerakanAI();
            }
        }
    }

    function handleKotakClick(baris, kolom) {
        if (isGameOver || pionUntukPromosi) return;
        if (isPemainVsAI && giliranSekarang !== playerColor) return;
        const bidakDiKlik = papanSekarang[baris][kolom];
        if (kotakTerpilih) {
            if (gerakanSah.find(g => g[0] === baris && g[1] === kolom)) {
                pindahkanBidak(kotakTerpilih.baris, kotakTerpilih.kolom, baris, kolom);
            } else {
                resetSorotan();
                if (bidakDiKlik !== ' ') pilihBidak(baris, kolom);
            }
        } else if (bidakDiKlik !== ' ') {
            pilihBidak(baris, kolom);
        }
    }

    function pilihBidak(baris, kolom) {
        const bidak = papanSekarang[baris][kolom];
        const isPutih = bidak === bidak.toUpperCase();
        if ((giliranSekarang === 'putih' && !isPutih) || (giliranSekarang === 'hitam' && isPutih)) return;
        resetSorotan();
        kotakTerpilih = { baris, kolom };
        const papanDibalik = isPemainVsAI && playerColor === 'hitam';
        const idx = papanDibalik ? (7 - baris) * 8 + (7 - kolom) : baris * 8 + kolom;
        if (papanElement.children[idx]) papanElement.children[idx].classList.add('terpilih');
        
        gerakanSah = filterGerakanSkak(getGerakanSah(bidak, baris, kolom, papanSekarang, statusGerakan), baris, kolom, papanSekarang, statusGerakan);
        
        gerakanSah.forEach(([gBaris, gKolom]) => {
             const gIdx = papanDibalik ? (7 - gBaris) * 8 + (7 - gKolom) : gBaris * 8 + gKolom;
             if (papanElement.children[gIdx]) papanElement.children[gIdx].classList.add('gerakan-sah');
        });
    }

    async function pindahkanBidak(barisAsal, kolomAsal, barisTujuan, kolomTujuan) {
        const bidak = papanSekarang[barisAsal][kolomAsal];
        const bidakYangDimakan = papanSekarang[barisTujuan][kolomTujuan];

        if (bidakYangDimakan !== ' ') {
            if (giliranSekarang === 'putih') bidakDimakan.putih.push(bidakYangDimakan);
            else bidakDimakan.hitam.push(bidakYangDimakan);
        }

        if (bidak.toLowerCase() === 'k' && Math.abs(kolomAsal - kolomTujuan) === 2) {
            riwayatGerakan.push(kolomTujuan > kolomAsal ? 'O-O' : 'O-O-O');
        } else {
            riwayatGerakan.push(`${simbolBidakTeks[bidak]} ${getNotasiAljabar(barisAsal, kolomAsal)}-${getNotasiAljabar(barisTujuan, kolomTujuan)}`);
        }

        if (bidak.toLowerCase() === 'k' && Math.abs(kolomAsal - kolomTujuan) === 2) {
            papanSekarang[barisTujuan][kolomTujuan] = bidak;
            papanSekarang[barisAsal][kolomAsal] = ' ';
            if (kolomTujuan === 6) {
                papanSekarang[barisTujuan][5] = papanSekarang[barisTujuan][7];
                papanSekarang[barisTujuan][7] = ' ';
            } else {
                papanSekarang[barisTujuan][3] = papanSekarang[barisTujuan][0];
                papanSekarang[barisTujuan][0] = ' ';
            }
        } else {
            papanSekarang[barisAsal][kolomAsal] = ' ';
            papanSekarang[barisTujuan][kolomTujuan] = bidak;
        }

        if (bidak === 'K') statusGerakan.K = true;
        if (bidak === 'k') statusGerakan.k = true;
        if (bidak === 'R' && barisAsal === 7 && kolomAsal === 0) statusGerakan.R_a1 = true;
        if (bidak === 'R' && barisAsal === 7 && kolomAsal === 7) statusGerakan.R_h1 = true;
        if (bidak === 'r' && barisAsal === 0 && kolomAsal === 0) statusGerakan.r_a8 = true;
        if (bidak === 'r' && barisAsal === 0 && kolomAsal === 7) statusGerakan.r_h8 = true;

        resetSorotan();
        updateTampilanSetelahGerakan();

        const isPion = bidak.toLowerCase() === 'p';
        const barisAkhir = (bidak === 'P' && barisTujuan === 0) || (bidak === 'p' && barisTujuan === 7);
        if (isPion && barisAkhir) {
            pionUntukPromosi = { baris: barisTujuan, kolom: kolomTujuan };
            if (isPemainVsAI && giliranSekarang !== playerColor) {
                handlePromosi('q');
            } else {
                showOverlay('promosi-overlay');
            }
        } else {
            selesaikanGiliran();
        }
    }

    function periksaAkhirPermainan() {
        const warnaPemain = giliranSekarang;
        const totalGerakanSah = getAllGerakanMungkin(warnaPemain, papanSekarang, false, statusGerakan).length;
        if (totalGerakanSah === 0) {
            isGameOver = true;
            if (isRajaSkak(warnaPemain, papanSekarang, statusGerakan)) {
                const namaPemenang = warnaPemain === 'putih' ? namaPemainHitam : namaPemainPutih;
                updateInfoGiliran(`Skakmat! ${namaPemenang} Menang.`);
            } else {
                updateInfoGiliran("Remis! Permainan Seri.");
            }
            return true;
        }
        return false;
    }

    function getNotasiAljabar(b, k) { return `${'abcdefgh'[k]}${8-b}`; }

    pilihanPromosi.forEach(pilihan => pilihan.addEventListener('click', () => handlePromosi(pilihan.getAttribute('data-bidak'))));

    function handlePromosi(pilihanBidak) {
        if (!pionUntukPromosi) return;
        let bidakBaru = pilihanBidak;
        if (giliranSekarang === 'putih') bidakBaru = bidakBaru.toUpperCase();
        else bidakBaru = bidakBaru.toLowerCase();
        const { baris, kolom } = pionUntukPromosi;
        papanSekarang[baris][kolom] = bidakBaru;
        riwayatGerakan[riwayatGerakan.length - 1] += `=${simbolBidakTeks[bidakBaru]}`;
        hideAllOverlays();
        pionUntukPromosi = null;
        updateTampilanSetelahGerakan();
        selesaikanGiliran();
    }
    
    // FUNGSI HELPER UNTUK VALIDASI GERAKAN DI SISI UI
    function isKawan(b1, b2) { if (b1 === ' ' || b2 === ' ') return false; return (b1.toUpperCase() === b1) === (b2.toUpperCase() === b2); }
    function getGerakanLurus(r, c, p, a) { const g = []; const b = p[r][c]; a.forEach(([dr, dc]) => { let cr = r + dr, cc = c + dc; while (cr >= 0 && cr < 8 && cc >= 0 && cc < 8) { const t = p[cr][cc]; if (t === ' ') g.push([cr, cc]); else { if (!isKawan(b, t)) g.push([cr, cc]); break; } cr += dr; cc += dc; } }); return g; }
    function getGerakanPion(r, c, p) { const g = []; const b = p[r][c]; const a = (b === 'P') ? -1 : 1; const sr = (b === 'P') ? 6 : 1; if (p[r+a] && p[r+a][c] === ' ') { g.push([r+a, c]); if (r === sr && p[r+2*a] && p[r+2*a][c] === ' ') g.push([r+2*a, c]); } [c-1, c+1].forEach(tc => { if (tc >= 0 && tc < 8 && p[r+a]) { const bl = p[r+a][tc]; if (bl && bl !== ' ' && !isKawan(b, bl)) g.push([r+a, tc]); } }); return g; }
    function getGerakanKuda(r, c, p) { const g = []; const b = p[r][c]; const m = [[-2,1],[-2,-1],[2,1],[2,-1],[-1,2],[-1,-2],[1,2],[-1,-2]]; m.forEach(([dr, dc]) => { const tr = r+dr, tc = c+dc; if (tr>=0&&tr<8&&tc>=0&&tc<8) if (!isKawan(b, p[tr][tc])) g.push([tr, tc]); }); return g; }
    function getGerakanBenteng(r, c, p) { return getGerakanLurus(r,c,p,[[-1,0],[1,0],[0,-1],[0,1]]); }
    function getGerakanGajah(r, c, p) { return getGerakanLurus(r,c,p,[[-1,-1],[-1,1],[1,-1],[1,1]]); }
    function getGerakanRatu(r, c, p) { return [...getGerakanBenteng(r, c, p), ...getGerakanGajah(r, c, p)]; }
    function getGerakanRaja(r, c, p, statusGerakan) { const g = []; const b = p[r][c]; const w = (b === 'K') ? 'putih' : 'hitam'; [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => { const tr = r+dr, tc = c+dc; if (tr>=0&&tr<8&&tc>=0&&tc<8) if (!isKawan(b, p[tr][tc])) g.push([tr, tc]); }); if (!isRajaSkak(w, p, statusGerakan)) { if (w==='putih') { if (!statusGerakan.K&&!statusGerakan.R_h1&&p[7][5]===' '&&p[7][6]===' '&&!isKotakDiserang(7,5,'hitam',p,statusGerakan)&&!isKotakDiserang(7,6,'hitam',p,statusGerakan)) g.push([7,6]); if (!statusGerakan.K&&!statusGerakan.R_a1&&p[7][1]===' '&&p[7][2]===' '&&p[7][3]===' '&&!isKotakDiserang(7,2,'hitam',p,statusGerakan)&&!isKotakDiserang(7,3,'hitam',p,statusGerakan)) g.push([7,2]); } else { if (!statusGerakan.k&&!statusGerakan.r_h8&&p[0][5]===' '&&p[0][6]===' '&&!isKotakDiserang(0,5,'putih',p,statusGerakan)&&!isKotakDiserang(0,6,'putih',p,statusGerakan)) g.push([0,6]); if (!statusGerakan.k&&!statusGerakan.r_a8&&p[0][1]===' '&&p[0][2]===' '&&p[0][3]===' '&&!isKotakDiserang(0,2,'putih',p,statusGerakan)&&!isKotakDiserang(0,3,'putih',p,statusGerakan)) g.push([0,2]); } } return g; }
    function getGerakanSah(b, r, c, p, s) { switch (b.toLowerCase()) { case 'p': return getGerakanPion(r, c, p); case 'n': return getGerakanKuda(r, c, p); case 'r': return getGerakanBenteng(r, c, p); case 'b': return getGerakanGajah(r, c, p); case 'q': return getGerakanRatu(r, c, p); case 'k': return getGerakanRaja(r, c, p, s); default: return []; } }
    function isKotakDiserang(baris, kolom, warnaPenyerang, papan, statusGerakan) { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const bidak = papan[i][j]; if (bidak === ' ') continue; const isPenyerangPutih = (warnaPenyerang === 'putih'), isBidakPutih = (bidak.toUpperCase() === bidak); if ((isPenyerangPutih && isBidakPutih) || (!isPenyerangPutih && !isBidakPutih)) { const jenisBidak = bidak.toLowerCase(); if (jenisBidak === 'p') { const arahSerang = isPenyerangPutih ? -1 : 1; if (i + arahSerang === baris && (j - 1 === kolom || j + 1 === kolom)) return true; } else if (jenisBidak === 'k') { const gerakanSekitar = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]; for(const [dr, dc] of gerakanSekitar) { if (i + dr === baris && j + dc === kolom) return true; } } else { const gerakan = getGerakanSah(bidak, i, j, papan, statusGerakan); if (gerakan.some(g => g[0] === baris && g[1] === kolom)) return true; } } } return false; }
    function isRajaSkak(wr, p, s) { let rr, cr; const sr = (wr === 'putih') ? 'K' : 'k'; for (let i = 0; i < 8; i++) { for (let j = 0; j < 8; j++) if (p[i][j] === sr) { rr = i; cr = j; break; } if (rr !== undefined) break; } if (rr === undefined) return false; return isKotakDiserang(rr, cr, (wr === 'putih' ? 'hitam' : 'putih'), p, s); }
    function filterGerakanSkak(sg, bar, bac, papan, status) { const ba = papan[bar][bac]; const wb = (ba.toUpperCase() === ba) ? 'putih' : 'hitam'; return sg.filter(g => { const [bt, bc] = g; const ps = papan.map(b => b.slice()); ps[bt][bc] = ba; ps[bar][bac] = ' '; return !isRajaSkak(wb, ps, status); }); }
    function getAllGerakanMungkin(warna, papan, hanyaMakan, status) { const g = []; for (let i=0; i<8; i++) for (let j=0; j<8; j++) { const b = papan[i][j]; if (b !== ' ') { const isW = b === b.toUpperCase(); if ((warna==='putih'&&isW) || (warna==='hitam'&&!isW)) { let sg = filterGerakanSkak(getGerakanSah(b,i,j,papan,status),i,j,papan,status); if (hanyaMakan) { sg = sg.filter(m => papan[m[0]][m[1]] !== ' '); } sg.forEach(m => g.push({asal:[i,j],tujuan:m})); }}} return g;}
});
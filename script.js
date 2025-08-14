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
    btnBackToMenu.addEventListener('click', () => showScreen('initial-screen'));

    btnVsPlayer.addEventListener('click', () => {
        hideAllOverlays();
        showOverlay('player-names-overlay');
    });

    btnStartPvpGame.addEventListener('click', () => {
        isPemainVsAI = false;
        namaPemainPutih = inputNamaPutih.value.trim() || 'Pemain Putih';
        namaPemainHitam = inputNamaHitam.value.trim() || 'Pemain Hitam';
        startGame();
    });

    btnVsAI.addEventListener('click', () => {
        isPemainVsAI = true;
        namaPemainPutih = 'Pemain';
        namaPemainHitam = 'AI';
        hideAllOverlays();
        showOverlay('color-choice-overlay');
    });

    btnPlayWhite.addEventListener('click', () => {
        playerColor = 'putih';
        namaPemainPutih = 'Pemain';
        namaPemainHitam = 'AI';
        startGame();
    });

    btnPlayBlack.addEventListener('click', () => {
        playerColor = 'hitam';
        namaPemainPutih = 'AI';
        namaPemainHitam = 'Pemain';
        startGame();
    });

    function startGame() {
        hideAllOverlays();
        showScreen('game-screen');
        mulaiGameBaru();
    }

    tombolGameBaru.addEventListener('click', () => {
        mulaiGameBaru();
    });

    // === LOGIKA TEMA ===
    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });
        localStorage.setItem('chessTheme', themeName);
    }
    themeButtons.forEach(button => {
        button.addEventListener('click', () => applyTheme(button.dataset.theme));
    });
    const savedTheme = localStorage.getItem('chessTheme') || 'default';
    applyTheme(savedTheme);


    // =====================================================================
    // === KODE LOGIKA GAME CATUR ==========================================
    // =====================================================================
    
    let papanSekarang, kotakTerpilih, gerakanSah, giliranSekarang, isGameOver, pionUntukPromosi, statusGerakan, riwayatGerakan, bidakDimakan;
    
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

    const KEDALAMAN_PENCARIAN = 4;
    const KEDALAMAN_QUIESCENCE = 3;
    const nilaiBidak = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };
    const pieceSquareTables = {
        'p': [[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],[5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]],
        'n': [[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
        'b': [[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
        'r': [[0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]],
        'q': [[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
        'k': [[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]]
    };

    function evaluasiPapan(papan) {
        let skorTotal = 0, jumlahGajahPutih = 0, jumlahGajahHitam = 0;
        let pionPutihPerLajur = Array(8).fill(0), pionHitamPerLajur = Array(8).fill(0);
        let lajurPionPutih = Array(8).fill(false), lajurPionHitam = Array(8).fill(false);
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
            const bidak = papan[i][j];
            if (bidak === 'p') { pionHitamPerLajur[j]++; lajurPionHitam[j] = true; }
            else if (bidak === 'P') { pionPutihPerLajur[j]++; lajurPionPutih[j] = true; }
        }
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
            const bidak = papan[i][j];
            if (bidak !== ' ') {
                const jenisBidak = bidak.toLowerCase(), skorBidak = nilaiBidak[jenisBidak], isPutih = bidak === bidak.toUpperCase();
                const pst = pieceSquareTables[jenisBidak], skorPosisi = isPutih ? pst[i][j] : pst[7-i][j];
                let bonusTambahan = 0;
                if (jenisBidak === 'b') { if (isPutih) jumlahGajahPutih++; else jumlahGajahHitam++; }
                if (jenisBidak === 'r') { if (!lajurPionPutih[j]) bonusTambahan += 15; if (!lajurPionHitam[j]) bonusTambahan += isPutih ? 0 : 15; }
                if (jenisBidak === 'p') {
                    const penaltiStruktur = 20;
                    if ((isPutih && pionPutihPerLajur[j] > 1) || (!isPutih && pionHitamPerLajur[j] > 1)) bonusTambahan -= penaltiStruktur;
                    const lajurKiri = j > 0 ? j - 1 : -1, lajurKanan = j < 7 ? j + 1 : -1;
                    if ((isPutih && (lajurKiri===-1 || !lajurPionPutih[lajurKiri]) && (lajurKanan===-1 || !lajurPionPutih[lajurKanan])) || (!isPutih && (lajurKiri===-1 || !lajurPionHitam[lajurKiri]) && (lajurKanan===-1 || !lajurPionHitam[lajurKanan]))) bonusTambahan -= penaltiStruktur;
                    let isBebas = true;
                    if (isPutih) { for (let k = i - 1; k >= 0; k--) if (papan[k][j] === 'p' || (j>0 && papan[k][j-1]==='p') || (j<7 && papan[k][j+1]==='p')) { isBebas = false; break; } }
                    else { for (let k = i + 1; k < 8; k++) if (papan[k][j] === 'P' || (j>0 && papan[k][j-1]==='P') || (j<7 && papan[k][j+1]==='P')) { isBebas = false; break; } }
                    if(isBebas) { const bonusPionBebas = [0, 80, 60, 40, 30, 20, 10, 0]; bonusTambahan += isPutih ? bonusPionBebas[i] : bonusPionBebas[7-i]; }
                }
                skorTotal += (skorBidak + skorPosisi + bonusTambahan) * (isPutih ? 1 : -1);
            }
        }
        if (jumlahGajahPutih >= 2) skorTotal += 50; if (jumlahGajahHitam >= 2) skorTotal -= 50;
        return skorTotal;
    }
    
    function quiescenceSearch(papan, alpha, beta, isMaximizingPlayer, kedalaman) {
        if (kedalaman === 0) return evaluasiPapan(papan);
        const stand_pat = evaluasiPapan(papan);
        if (isMaximizingPlayer) {
            if (stand_pat >= beta) return beta;
            if (stand_pat > alpha) alpha = stand_pat;
            const gerakanMakan = getAllGerakanMungkin('putih', papan, true);
            for (const gerakan of gerakanMakan) {
                const [barisAsal, kolomAsal] = gerakan.asal, [barisTujuan, kolomTujuan] = gerakan.tujuan;
                const bidakAsal = papan[barisAsal][kolomAsal], bidakTujuan = papan[barisTujuan][kolomTujuan];
                papan[barisTujuan][kolomTujuan] = bidakAsal; papan[barisAsal][kolomAsal] = ' ';
                const skor = quiescenceSearch(papan, alpha, beta, false, kedalaman - 1);
                papan[barisAsal][kolomAsal] = bidakAsal; papan[barisTujuan][kolomTujuan] = bidakTujuan;
                if (skor >= beta) return beta;
                if (skor > alpha) alpha = skor;
            }
            return alpha;
        } else {
            if (stand_pat <= alpha) return alpha;
            if (stand_pat < beta) beta = stand_pat;
            const gerakanMakan = getAllGerakanMungkin('hitam', papan, true);
            for (const gerakan of gerakanMakan) {
                const [barisAsal, kolomAsal] = gerakan.asal, [barisTujuan, kolomTujuan] = gerakan.tujuan;
                const bidakAsal = papan[barisAsal][kolomAsal], bidakTujuan = papan[barisTujuan][kolomTujuan];
                papan[barisTujuan][kolomTujuan] = bidakAsal; papan[barisAsal][kolomAsal] = ' ';
                const skor = quiescenceSearch(papan, alpha, beta, true, kedalaman - 1);
                papan[barisAsal][kolomAsal] = bidakAsal; papan[barisTujuan][kolomTujuan] = bidakTujuan;
                if (skor <= alpha) return alpha;
                if (skor < beta) beta = skor;
            }
            return beta;
        }
    }

    function minimax(papan, kedalaman, alpha, beta, isMaximizingPlayer) {
        if (kedalaman === 0) {
            return quiescenceSearch(papan, alpha, beta, isMaximizingPlayer, KEDALAMAN_QUIESCENCE);
        }
        const warna = isMaximizingPlayer ? 'putih' : 'hitam';
        const semuaGerakan = getAllGerakanMungkin(warna, papan, false);
        if (semuaGerakan.length === 0) {
            return isRajaSkak(warna, papan) ? (isMaximizingPlayer ? -Infinity : Infinity) : 0;
        }
        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            for (const gerakan of semuaGerakan) {
                const [barisAsal, kolomAsal] = gerakan.asal, [barisTujuan, kolomTujuan] = gerakan.tujuan;
                const bidakAsal = papan[barisAsal][kolomAsal], bidakTujuan = papan[barisTujuan][kolomTujuan];
                papan[barisTujuan][kolomTujuan] = bidakAsal; papan[barisAsal][kolomAsal] = ' ';
                let evaluasi = minimax(papan, kedalaman - 1, alpha, beta, false);
                papan[barisAsal][kolomAsal] = bidakAsal; papan[barisTujuan][kolomTujuan] = bidakTujuan;
                maxEval = Math.max(maxEval, evaluasi); alpha = Math.max(alpha, evaluasi);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const gerakan of semuaGerakan) {
                const [barisAsal, kolomAsal] = gerakan.asal, [barisTujuan, kolomTujuan] = gerakan.tujuan;
                const bidakAsal = papan[barisAsal][kolomAsal], bidakTujuan = papan[barisTujuan][kolomTujuan];
                papan[barisTujuan][kolomTujuan] = bidakAsal; papan[barisAsal][kolomAsal] = ' ';
                let evaluasi = minimax(papan, kedalaman - 1, alpha, beta, true);
                papan[barisAsal][kolomAsal] = bidakAsal; papan[barisTujuan][kolomTujuan] = bidakTujuan;
                minEval = Math.min(minEval, evaluasi); beta = Math.min(beta, evaluasi);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function getAllGerakanMungkin(warna, papan, hanyaMakan = false) {
        const gerakan = [];
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
            const bidak = papan[i][j];
            if (bidak !== ' ') {
                const isPutih = bidak === bidak.toUpperCase();
                if ((warna === 'putih' && isPutih) || (warna === 'hitam' && !isPutih)) {
                    let gerakanSahUntukBidak = filterGerakanSkak(getGerakanSah(bidak, i, j, papan), i, j, papan);
                    if (hanyaMakan) {
                        gerakanSahUntukBidak = gerakanSahUntukBidak.filter(g => papan[g[0]][g[1]] !== ' ');
                    }
                    gerakanSahUntukBidak.forEach(g => gerakan.push({ asal: [i, j], tujuan: g }));
                }
            }
        }
        return gerakan;
    }

    function cariGerakanTerbaik(papan) {
        const warnaAI = giliranSekarang;
        const isAIWhite = (warnaAI === 'putih');
        let gerakanTerbaik = null, nilaiTerbaik = isAIWhite ? -Infinity : Infinity;
        const semuaGerakan = getAllGerakanMungkin(warnaAI, papan, false);
        semuaGerakan.sort(() => Math.random() - 0.5);
        for (const gerakan of semuaGerakan) {
            const [barisAsal, kolomAsal] = gerakan.asal, [barisTujuan, kolomTujuan] = gerakan.tujuan;
            const bidakAsal = papan[barisAsal][kolomAsal], bidakTujuan = papan[barisTujuan][kolomTujuan];
            papan[barisTujuan][kolomTujuan] = bidakAsal; papan[barisAsal][kolomAsal] = ' ';
            let nilai = minimax(papan, KEDALAMAN_PENCARIAN - 1, -Infinity, Infinity, !isAIWhite);
            papan[barisAsal][kolomAsal] = bidakAsal; papan[barisTujuan][kolomTujuan] = bidakTujuan;
            if (isAIWhite) {
                if (nilai > nilaiTerbaik) { nilaiTerbaik = nilai; gerakanTerbaik = gerakan; }
            } else {
                if (nilai < nilaiTerbaik) { nilaiTerbaik = nilai; gerakanTerbaik = gerakan; }
            }
        }
        return gerakanTerbaik;
    }

    function buatGerakanAI() {
        if (isGameOver) return;
        updateInfoGiliran("AI sedang berpikir...");
        papanElement.classList.add('papan-sibuk');
        setTimeout(() => {
            const gerakanAI = cariGerakanTerbaik(papanSekarang);
            papanElement.classList.remove('papan-sibuk');
            if (gerakanAI) pindahkanBidak(gerakanAI.asal[0], gerakanAI.asal[1], gerakanAI.tujuan[0], gerakanAI.tujuan[1]);
            else console.log("AI tidak menemukan gerakan!");
        }, 100);
    }

    function mulaiGameBaru() {
        papanSekarang = papanAwal.map(b => b.slice());
        kotakTerpilih = null; gerakanSah = []; giliranSekarang = 'putih'; isGameOver = false; pionUntukPromosi = null;
        statusGerakan = { K: false, R_a1: false, R_h1: false, k: false, r_a8: false, r_h8: false };
        riwayatGerakan = []; bidakDimakan = { putih: [], hitam: [] };
        hideAllOverlays();

        labelBidakDimakanPutih.textContent = `Dimakan oleh ${namaPemainPutih}`;
        labelBidakDimakanHitam.textContent = `Dimakan oleh ${namaPemainHitam}`;

        updateInfoGiliran(); 
        renderPapan(); 
        renderRiwayat(); 
        renderBidakDimakan();
        if (isPemainVsAI && playerColor === 'hitam' && giliranSekarang === 'putih') {
            buatGerakanAI();
        }
    }
    
    function renderPapan() {
        papanElement.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const kotak = document.createElement('div');
                const isGelap = (i + j) % 2 === 1;
                kotak.classList.add('kotak', isGelap ? 'gelap' : 'terang');
                
                const bidak = papanSekarang ? papanSekarang[i][j] : ' ';
                if (bidak !== ' ' && papanSekarang) {
                    const imgBidak = document.createElement('img');
                    imgBidak.src = pathGambarBidak[bidak];
                    imgBidak.alt = bidak;
                    kotak.appendChild(imgBidak);
                }
                kotak.addEventListener('click', (event) => handleKotakClick(event, i, j));
                papanElement.appendChild(kotak);
            }
        }
        if (!papanSekarang) return;
        
        const warnaRajaDalamBahaya = giliranSekarang;
        if (!isGameOver && isRajaSkak(warnaRajaDalamBahaya, papanSekarang)) {
            const simbolRaja = warnaRajaDalamBahaya === 'putih' ? 'K' : 'k';
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if (papanSekarang[i][j] === simbolRaja) {
                        papanElement.children[i * 8 + j].classList.add('skak');
                    }
                }
            }
        }
    }

    function renderBidakDimakan() {
        areaBidakDimakanPutih.innerHTML = '';
        areaBidakDimakanHitam.innerHTML = '';
        if (!bidakDimakan) return;
        // Bidak hitam yang dimakan oleh pemain putih
        bidakDimakan.putih.forEach(bidak => {
            const img = document.createElement('img');
            img.src = pathGambarBidak[bidak];
            areaBidakDimakanPutih.appendChild(img);
        });
        // Bidak putih yang dimakan oleh pemain hitam
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
        } else {
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

    async function jalankanAnimasiKemenangan() {
        papanElement.classList.add('papan-sibuk');
        const warnaPemenang = giliranSekarang === 'putih' ? 'hitam' : 'putih';
        const bidakPemenangElements = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const bidak = papanSekarang[i][j];
                if (bidak !== ' ') {
                    const isBidakPutih = (bidak.toUpperCase() === bidak);
                    if ((warnaPemenang === 'putih' && isBidakPutih) || (warnaPemenang === 'hitam' && !isBidakPutih)) {
                        const kotakElement = papanElement.children[i * 8 + j];
                        const imgElement = kotakElement.querySelector('img');
                        if (imgElement) bidakPemenangElements.push(imgElement);
                    }
                }
            }
        }
        for (const img of bidakPemenangElements) {
            img.classList.add('bidak-pemenang');
            setTimeout(() => img.classList.remove('bidak-pemenang'), 600);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        papanElement.classList.remove('papan-sibuk');
    }

    function handleKotakClick(event, baris, kolom) {
        if (!papanSekarang || isGameOver || pionUntukPromosi) return;
        if (isPemainVsAI && giliranSekarang !== playerColor) return;
        const bidakDiKlik = papanSekarang[baris][kolom];
        if (kotakTerpilih) {
            if (gerakanSah.find(g => g[0] === baris && g[1] === kolom)) {
                pindahkanBidak(kotakTerpilih.baris, kotakTerpilih.kolom, baris, kolom);
            } else {
                resetSorotan();
                if (bidakDiKlik !== ' ') pilihBidak(event.currentTarget, baris, kolom);
            }
        } else if (bidakDiKlik !== ' ') {
            pilihBidak(event.currentTarget, baris, kolom);
        }
    }

    function pilihBidak(element, baris, kolom) {
        const bidak = papanSekarang[baris][kolom];
        const isPutih = bidak === bidak.toUpperCase();
        if ((giliranSekarang === 'putih' && !isPutih) || (giliranSekarang === 'hitam' && isPutih)) return;
        resetSorotan();
        kotakTerpilih = { element, baris, kolom };
        element.classList.add('terpilih');
        gerakanSah = filterGerakanSkak(getGerakanSah(bidak, baris, kolom, papanSekarang), baris, kolom, papanSekarang);
        gerakanSah.forEach(g => papanElement.children[g[0] * 8 + g[1]].classList.add('gerakan-sah'));
    }

    async function pindahkanBidak(barisAsal, kolomAsal, barisTujuan, kolomTujuan) {
        papanElement.classList.add('papan-sibuk');
        const kotakAsalElement = papanElement.children[barisAsal * 8 + kolomAsal];
        const kotakTujuanElement = papanElement.children[barisTujuan * 8 + kolomTujuan];
        const imgAsal = kotakAsalElement.querySelector('img');
        const imgDimakan = kotakTujuanElement.querySelector('img');
        const bidak = papanSekarang[barisAsal][kolomAsal];
        const bidakYangDimakan = papanSekarang[barisTujuan][kolomTujuan];

        if (imgDimakan) {
            imgDimakan.classList.add('terkena-makan');
        }

        if (imgAsal) {
            const asalRect = kotakAsalElement.getBoundingClientRect();
            const tujuanRect = kotakTujuanElement.getBoundingClientRect();
            const bidakTerbang = imgAsal.cloneNode();
            
            bidakTerbang.classList.add('bidak-terbang');
            document.body.appendChild(bidakTerbang);
            
            bidakTerbang.style.top = `${asalRect.top}px`;
            bidakTerbang.style.left = `${asalRect.left}px`;
            imgAsal.style.opacity = '0';
            
            const dx = tujuanRect.left - asalRect.left;
            const dy = tujuanRect.top - asalRect.top;

            bidakTerbang.style.setProperty('--dx-mid', `${dx / 2}px`);
            bidakTerbang.style.setProperty('--dy-mid', `${dy / 2}px`);
            bidakTerbang.style.setProperty('--dx-end', `${dx}px`);
            bidakTerbang.style.setProperty('--dy-end', `${dy}px`);
            
            await new Promise(resolve => setTimeout(resolve, 400));
            
            if (bidakTerbang.parentNode) {
                document.body.removeChild(bidakTerbang);
            }
        }

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
        renderRiwayat();
        renderBidakDimakan();
        renderPapan();
        papanElement.classList.remove('papan-sibuk');

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
        const totalGerakanSah = getAllGerakanMungkin(warnaPemain, papanSekarang).length;
        if (totalGerakanSah === 0) {
            isGameOver = true;
            if (isRajaSkak(warnaPemain, papanSekarang)) {
                const namaPemenang = warnaPemain === 'putih' ? namaPemainHitam : namaPemainPutih;
                updateInfoGiliran(`Skakmat! ${namaPemenang} Menang.`);
                jalankanAnimasiKemenangan();
            } else {
                updateInfoGiliran("Remis! Permainan Seri.");
            }
            return true;
        }
        return false;
    }

    function getNotasiAljabar(b, k) { return `${'abcdefgh'[k]}${8-b}`; }

    function isKawan(b1, b2) {
        if (b1 === ' ' || b2 === ' ') return false;
        return (b1.toUpperCase() === b1) === (b2.toUpperCase() === b2);
    }

    function getGerakanLurus(r, c, p, a) {
        const g = []; const b = p[r][c];
        a.forEach(([dr, dc]) => {
            let cr = r + dr, cc = c + dc;
            while (cr >= 0 && cr < 8 && cc >= 0 && cc < 8) {
                const t = p[cr][cc];
                if (t === ' ') g.push([cr, cc]);
                else { if (!isKawan(b, t)) g.push([cr, cc]); break; }
                cr += dr; cc += dc;
            }
        });
        return g;
    }

    function getGerakanPion(r, c, p) {
        const g = []; const b = p[r][c]; const a = (b === 'P') ? -1 : 1; const sr = (b === 'P') ? 6 : 1;
        if (p[r + a] && p[r + a][c] === ' ') {
            g.push([r + a, c]);
            if (r === sr && p[r + 2 * a] && p[r + 2 * a][c] === ' ') g.push([r + 2 * a, c]);
        }
        [c - 1, c + 1].forEach(tc => {
            if (tc >= 0 && tc < 8 && p[r + a]) {
                const bl = p[r + a][tc];
                if (bl && bl !== ' ' && !isKawan(b, bl)) g.push([r + a, tc]);
            }
        });
        return g;
    }

    function getGerakanKuda(r, c, p) {
        const g = []; const b = p[r][c];
        const m = [[-2, 1], [-2, -1], [2, 1], [2, -1], [-1, 2], [-1, -2], [1, 2], [1, -2]];
        m.forEach(([dr, dc]) => {
            const tr = r + dr, tc = c + dc;
            if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8)
                if (!isKawan(b, p[tr][tc])) g.push([tr, tc]);
        });
        return g;
    }

    function getGerakanBenteng(r, c, p) { return getGerakanLurus(r, c, p, [[-1, 0], [1, 0], [0, -1], [0, 1]]); }
    function getGerakanGajah(r, c, p) { return getGerakanLurus(r, c, p, [[-1, -1], [-1, 1], [1, -1], [1, 1]]); }
    function getGerakanRatu(r, c, p) { return [...getGerakanBenteng(r, c, p), ...getGerakanGajah(r, c, p)]; }

    function getGerakanRaja(r, c, p) {
        const g = []; const b = p[r][c]; const w = (b === 'K') ? 'putih' : 'hitam';
        [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => {
            const tr = r + dr, tc = c + dc;
            if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8)
                if (!isKawan(b, p[tr][tc])) g.push([tr, tc]);
        });
        if (!isRajaSkak(w, p)) {
            if (w === 'putih') {
                if (!statusGerakan.K && !statusGerakan.R_h1 && p[7][5] === ' ' && p[7][6] === ' ' && !isKotakDiserang(7, 5, 'hitam', p) && !isKotakDiserang(7, 6, 'hitam', p)) g.push([7, 6]);
                if (!statusGerakan.K && !statusGerakan.R_a1 && p[7][1] === ' ' && p[7][2] === ' ' && p[7][3] === ' ' && !isKotakDiserang(7, 2, 'hitam', p) && !isKotakDiserang(7, 3, 'hitam', p)) g.push([7, 2]);
            } else {
                if (!statusGerakan.k && !statusGerakan.r_h8 && p[0][5] === ' ' && p[0][6] === ' ' && !isKotakDiserang(0, 5, 'putih', p) && !isKotakDiserang(0, 6, 'putih', p)) g.push([0, 6]);
                if (!statusGerakan.k && !statusGerakan.r_a8 && p[0][1] === ' ' && p[0][2] === ' ' && p[0][3] === ' ' && !isKotakDiserang(0, 2, 'putih', p) && !isKotakDiserang(0, 3, 'putih', p)) g.push([0, 2]);
            }
        }
        return g;
    }

    function getGerakanSah(b, r, c, p) {
        switch (b.toLowerCase()) {
            case 'p': return getGerakanPion(r, c, p);
            case 'n': return getGerakanKuda(r, c, p);
            case 'r': return getGerakanBenteng(r, c, p);
            case 'b': return getGerakanGajah(r, c, p);
            case 'q': return getGerakanRatu(r, c, p);
            case 'k': return getGerakanRaja(r, c, p);
            default: return [];
        }
    }

    function isKotakDiserang(baris, kolom, warnaPenyerang, papan) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const bidak = papan[i][j];
                if (bidak === ' ') continue;
                const isPenyerangPutih = (warnaPenyerang === 'putih');
                const isBidakPutih = (bidak.toUpperCase() === bidak);
                if ((isPenyerangPutih && isBidakPutih) || (!isPenyerangPutih && !isBidakPutih)) {
                    const jenisBidak = bidak.toLowerCase();
                    if (jenisBidak === 'p') {
                        const arahSerang = isPenyerangPutih ? -1 : 1;
                        if (i + arahSerang === baris && (j - 1 === kolom || j + 1 === kolom)) return true;
                    } else if (jenisBidak === 'k') {
                        const gerakanSekitar = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
                        for (const [dr, dc] of gerakanSekitar) {
                            if (i + dr === baris && j + dc === kolom) return true;
                        }
                    } else {
                        const gerakan = getGerakanSah(bidak, i, j, papan);
                        if (gerakan.some(g => g[0] === baris && g[1] === kolom)) return true;
                    }
                }
            }
        }
        return false;
    }

    function isRajaSkak(wr, p) {
        let rr, cr; const sr = (wr === 'putih') ? 'K' : 'k';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) if (p[i][j] === sr) { rr = i; cr = j; break; }
            if (rr !== undefined) break;
        }
        if (rr === undefined) return false;
        return isKotakDiserang(rr, cr, (wr === 'putih' ? 'hitam' : 'putih'), p);
    }

    function filterGerakanSkak(sg, bar, bac, papanSekarang) {
        const ba = papanSekarang[bar][bac];
        const wb = (ba.toUpperCase() === ba) ? 'putih' : 'hitam';
        return sg.filter(g => {
            const [bt, bc] = g;
            const ps = papanSekarang.map(b => b.slice());
            ps[bt][bc] = ba;
            ps[bar][bac] = ' ';
            return !isRajaSkak(wb, ps);
        });
    }

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
        renderRiwayat();
        renderPapan();
        selesaikanGiliran();
    }

});
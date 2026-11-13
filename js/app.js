// NASA Space Apps Challenge 2026 · Controlador de Modelos 3D y Persistencia

document.addEventListener('DOMContentLoaded', () => {
    initAll3DViewers();
    initScrollAnimations();
    initNavbarScrollSpy();
    initUnifiedIdeasAndPoll();
    initAgreementsModule();
});

/* ============================================================
   1. Inicialización y rotación física inercial de modelos 3D
   ============================================================ */
function initAll3DViewers() {
    const models = [
        { id: 'curiosityViewer', key: 'curiosity', file: '24584_Curiosity_static.glb', iosSrc: '24584_Curiosity_static.usdz', defaultOrbit: '30deg 75deg 3.4m' },
        { id: 'ingenuityViewer', key: 'ingenuity', file: 'Ingenuity.glb', iosSrc: 'Ingenuity.usdz', defaultOrbit: '0deg 75deg 1.8m' },
        { id: 'vikingViewer', key: 'viking', file: 'Viking Lander.glb', iosSrc: '', defaultOrbit: '30deg 70deg 3.0m' },
        { id: 'keplerViewer', key: 'kepler', file: 'Kepler (A).glb', iosSrc: '', defaultOrbit: '45deg 70deg 11m' }
    ];

    models.forEach(m => {
        const viewer = document.getElementById(m.id);
        if (!viewer) return;

        // Carga desde memoria base64 para evitar restricciones CORS en file:///
        if (window.MODELS_3D && window.MODELS_3D[m.key]) {
            viewer.src = window.MODELS_3D[m.key];
        } else {
            viewer.src = m.file;
        }

        if (m.iosSrc) {
            viewer.setAttribute('ios-src', m.iosSrc);
        }

        viewer.cameraOrbit = m.defaultOrbit;
        viewer.cameraControls = true;
        viewer.touchAction = 'pan-y';
        viewer.interactionPrompt = 'none';

        viewer.addEventListener('load', () => {
            viewer.classList.add('loaded');
            const loader = viewer.parentElement ? viewer.parentElement.querySelector('.stage-loader') : null;
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => { loader.style.display = 'none'; }, 300);
            }
        });
    });

    // Interpolación física e inercia al hacer scroll
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                models.forEach(m => {
                    const viewer = document.getElementById(m.id);
                    if (viewer && !viewer.matches(':active')) {
                        const rect = viewer.getBoundingClientRect();
                        if (rect.top < window.innerHeight && rect.bottom > 0) {
                            const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
                            let baseDeg = 30;
                            let phi = '70deg';
                            let rad = '3.2m';

                            if (m.key === 'ingenuity') {
                                baseDeg = 0;
                                phi = '75deg';
                                rad = '1.8m';
                            } else if (m.key === 'kepler') {
                                baseDeg = 45;
                                phi = '70deg';
                                rad = '11m'; // Zoom óptimo y encuadre amplio para Kepler
                            }

                            const orbitDeg = (baseDeg + progress * 55).toFixed(1);
                            viewer.cameraOrbit = `${orbitDeg}deg ${phi} ${rad}`;
                        }
                    }
                });
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/* ============================================================
   2. Barra de navegación con ScrollSpy e iluminación continua
   ============================================================ */
function initNavbarScrollSpy() {
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length === 0) return;

    const sections = [
        { id: 'inicio', navKey: 'inicio' },
        { id: 'modelos3d', navKey: 'modelos3d' },
        { id: 'etapas', navKey: 'etapas' },
        { id: 'equipo', navKey: 'equipo' },
        { id: 'lenguaje', navKey: 'lenguaje' },
        { id: 'audiencia', navKey: 'audiencia' },
        { id: 'recursos', navKey: 'recursos' },
        { id: 'ideas', navKey: 'ideas' },
        { id: 'votacion', navKey: 'votacion' },
        { id: 'acuerdos', navKey: 'acuerdos' }
    ];

    function onScroll() {
        const scrollPos = window.scrollY + 180;
        let activeId = 'inicio';

        for (let i = 0; i < sections.length; i++) {
            const secEl = document.getElementById(sections[i].id);
            if (secEl) {
                const top = secEl.offsetTop;
                const height = secEl.offsetHeight;
                if (scrollPos >= top && scrollPos < top + height) {
                    activeId = sections[i].id;
                    break;
                }
                if (scrollPos >= top) {
                    activeId = sections[i].id;
                }
            }
        }

        navItems.forEach(item => {
            const target = item.getAttribute('href') ? item.getAttribute('href').replace('#', '') : '';
            const navKey = item.getAttribute('data-nav');

            if (target === activeId || navKey === activeId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ============================================================
   3. Animaciones de revelación con scroll y máscaras de texto
   ============================================================ */
function initScrollAnimations() {
    const elements = document.querySelectorAll('.fade-up, .reveal-mask');
    if (!('IntersectionObserver' in window)) {
        elements.forEach(el => el.classList.add('visible', 'active'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible', 'active');
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

/* ============================================================
   4. Conexión dinámica unificada: Ideas y Votación sincronizadas
   ============================================================ */
const STORAGE_IDEAS_KEY = 'nasa_space_apps_meeting_ideas_v2';
const STORAGE_USER_VOTE_KEY = 'nasa_space_apps_user_selected_vote';

const defaultIdeasState = [
    { id: 'idea-1', title: 'Cuento o narrativa ilustrada sobre el viaje espacial', votes: 2 },
    { id: 'idea-2', title: 'Sitio web o experiencia interactiva 3D con datos de la NASA', votes: 3 },
    { id: 'idea-3', title: 'Juego didáctico sobre misiones espaciales para jóvenes', votes: 1 },
    { id: 'idea-4', title: 'Mini podcast o video documental con sonidos de Marte', votes: 1 }
];

function initUnifiedIdeasAndPoll() {
    const input = document.getElementById('ideaInput');
    const addBtn = document.getElementById('addIdeaBtn');
    const chipsContainer = document.getElementById('ideasChips');
    const pollContainer = document.getElementById('pollCardsContainer');
    const resetBtn = document.getElementById('resetVotesBtn');

    let ideas = loadIdeas();
    let selectedVoteId = localStorage.getItem(STORAGE_USER_VOTE_KEY) || null;

    function loadIdeas() {
        try {
            const raw = localStorage.getItem(STORAGE_IDEAS_KEY);
            return raw ? JSON.parse(raw) : [...defaultIdeasState];
        } catch (e) {
            return [...defaultIdeasState];
        }
    }

    function saveIdeas() {
        try {
            localStorage.setItem(STORAGE_IDEAS_KEY, JSON.stringify(ideas));
            if (selectedVoteId) {
                localStorage.setItem(STORAGE_USER_VOTE_KEY, selectedVoteId);
            } else {
                localStorage.removeItem(STORAGE_USER_VOTE_KEY);
            }
        } catch (e) {}
    }

    function renderAll() {
        renderIdeasChips();
        renderPollCards();
    }

    // Render de fichas en "¿Qué nos gustaría explorar?"
    function renderIdeasChips() {
        if (!chipsContainer) return;
        chipsContainer.innerHTML = '';

        if (ideas.length === 0) {
            chipsContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 14px;">No hay ideas registradas todavía.</span>';
            return;
        }

        ideas.forEach((item, index) => {
            const chip = document.createElement('div');
            chip.className = 'idea-chip';
            chip.innerHTML = `
                <span>${escapeHtml(item.title)}</span>
                <button type="button" title="Eliminar idea" aria-label="Eliminar idea">✕</button>
            `;

            chip.querySelector('button').addEventListener('click', () => {
                if (selectedVoteId === item.id) {
                    selectedVoteId = null;
                }
                ideas.splice(index, 1);
                saveIdeas();
                renderAll();
            });

            chipsContainer.appendChild(chip);
        });
    }

    // Render de tarjetas en "¿Qué tipo de experiencia nos interesa explorar?" (solo título)
    function renderPollCards() {
        if (!pollContainer) return;
        pollContainer.innerHTML = '';

        if (ideas.length === 0) {
            pollContainer.innerHTML = '<div style="color: #BACADE; font-size: 14px; grid-column: 1 / -1; padding: 24px;">Añade ideas en la sección anterior para verlas reflejadas aquí y votar.</div>';
            return;
        }

        const totalVotes = ideas.reduce((sum, item) => sum + (item.votes || 0), 0);

        ideas.forEach(item => {
            const votes = item.votes || 0;
            const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isSelected = selectedVoteId === item.id;

            const card = document.createElement('div');
            card.className = `poll-card-dynamic ${isSelected ? 'selected' : ''}`;
            card.innerHTML = `
                <div class="poll-card-title">${escapeHtml(item.title)}</div>
                
                <div class="poll-meta">
                    <span class="poll-votes-badge">${votes} ${votes === 1 ? 'voto' : 'votos'}</span>
                    <span class="poll-percent-badge">${percent}%</span>
                </div>
                
                <div class="poll-bar">
                    <div class="poll-fill" style="width: ${percent}%;"></div>
                </div>
            `;

            card.addEventListener('click', () => {
                if (selectedVoteId === item.id) {
                    // Si ya estaba seleccionada, retirar voto
                    item.votes = Math.max(0, item.votes - 1);
                    selectedVoteId = null;
                } else {
                    // Si había otra seleccionada previamente, descontar ese voto
                    if (selectedVoteId) {
                        const prev = ideas.find(i => i.id === selectedVoteId);
                        if (prev) prev.votes = Math.max(0, prev.votes - 1);
                    }
                    item.votes = (item.votes || 0) + 1;
                    selectedVoteId = item.id;
                }
                saveIdeas();
                renderPollCards();
            });

            pollContainer.appendChild(card);
        });
    }

    function handleAddIdea() {
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        const newIdea = {
            id: 'idea-' + Date.now(),
            title: text,
            votes: 0
        };

        ideas.push(newIdea);
        saveIdeas();
        renderAll();
        input.value = '';
        input.focus();
    }

    if (addBtn) addBtn.addEventListener('click', handleAddIdea);
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddIdea();
            }
        });
    }

    // Botón para reiniciar votaciones
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            ideas.forEach(i => i.votes = 0);
            selectedVoteId = null;
            saveIdeas();
            renderPollCards();
        });
    }

    renderAll();
}

/* ============================================================
   5. Módulo interactivo: Cuaderno de acuerdos
   ============================================================ */
const STORAGE_AGREEMENTS_KEY = 'nasa_space_apps_meeting_agreements';

const defaultAgreements = `- Horario de trabajo durante el evento: 9:00 am a 7:00 pm con pausas para comer.
- Canal principal de comunicación: Grupo de mensajería instantánea del equipo.
- Repositorio y documentos compartidos: Carpeta compartida para diseño y código.
- Criterio de entrega: Priorizar una experiencia terminada y accesible antes de sumar funciones adicionales.`;

function initAgreementsModule() {
    const textarea = document.getElementById('agreementsTextarea');
    const status = document.getElementById('agreementsStatus');
    if (!textarea) return;

    try {
        const saved = localStorage.getItem(STORAGE_AGREEMENTS_KEY);
        textarea.value = saved !== null ? saved : defaultAgreements;
    } catch (e) {
        textarea.value = defaultAgreements;
    }

    let timeout = null;
    textarea.addEventListener('input', () => {
        if (status) status.textContent = 'Guardando...';
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_AGREEMENTS_KEY, textarea.value);
                if (status) status.textContent = 'Guardado';
            } catch (e) {
                if (status) status.textContent = 'Error al guardar';
            }
        }, 400);
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

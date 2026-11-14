// Painel de Quartos: consome /quartos/painel e monta contadores, filtros, cards e estados dentro de #painel-quartos-view
// Chamado pelo roteador depois que a página é carregada: window.painelQuartos.renderizar()

window.painelQuartos = (function () {

let contadores = { total: 0, livres: 0, ocupados: 0, manutencao: 0 };
let quartos = [];
// filtro selecionado: 'TODOS', 'DISPONIVEL', 'OCUPADO' ou 'MANUTENCAO'
let filtroAtual = 'TODOS';
let carregando = false;
let mensagemErro = null;

const STATUS_QUARTO = {
    DISPONIVEL: { rotulo: 'Livre', classe: 'livre', icone: 'livre' },
    OCUPADO: { rotulo: 'Ocupado', classe: 'ocupado', icone: 'ocupado' },
    MANUTENCAO: { rotulo: 'Manutenção', classe: 'manutencao', icone: 'manutencao' },
    BLOQUEADO: { rotulo: 'Bloqueado', classe: 'bloqueado', icone: 'bloqueado' }
};

const TIPO_QUARTO = {
    SOLTEIRO: 'Solteiro',
    CASAL_STANDARD: 'Casal Standard',
    SUITE: 'Suíte',
    CASAL_LUXO: 'Casal Luxo',
    SOLTEIRO_EXECUTIVO: 'Solteiro Executivo',
    SUITE_VISTA_MAR: 'Suíte Vista Mar',
    DUPLO_SOLTEIRO: 'Duplo Solteiro',
    SUITE_EXECUTIVA: 'Suíte Executiva'
};

const MENSAGEM_FILTRO_VAZIO = {
    DISPONIVEL: 'Nenhum quarto livre no momento.',
    OCUPADO: 'Nenhum quarto ocupado no momento.',
    MANUTENCAO: 'Nenhum quarto em manutenção no momento.'
};

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

// ícones simples em svg
const iconeSvg = {
    total: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>',
    livre: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><path d="M5.5 8.2l1.8 1.8 3.2-3.6"/></svg>',
    ocupado: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5" r="2.5"/><path d="M3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5z"/></svg>',
    manutencao: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 2.5a3.5 3.5 0 0 0-3.3 4.7L2.5 12a1.4 1.4 0 0 0 2 2l4.8-4.7a3.5 3.5 0 0 0 4.7-3.3l-2 2-1.8-.5-.5-1.8z"/></svg>',
    bloqueado: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1.2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',
    checkin: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2.5h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3M2 8h8M7.5 5.2L10.3 8l-2.8 2.8"/></svg>',
    ver: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>',
    info: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 7.2V11M8 5v.01"/></svg>'
};

function escaparHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function montarContador(classe, titulo, valor) {
    return `
        <div class="pq-contador pq-contador-${classe}">
            <div>
                <div class="pq-contador-titulo">${titulo}</div>
                <div class="pq-contador-numero">${valor}</div>
            </div>
            <div class="pq-contador-icone">${iconeSvg[classe]}</div>
        </div>
    `;
}

function montarFiltro(texto, quantidade, valor) {
    const ativo = filtroAtual === valor ? ' ativo' : '';
    return `<button type="button" class="pq-filtro${ativo}" data-filtro="${valor}">${texto} <span>${quantidade}</span></button>`;
}

function montarCard(quarto) {
    const metaStatus = STATUS_QUARTO[quarto.status] || {
        rotulo: escaparHtml(quarto.status),
        classe: 'manutencao',
        icone: 'info'
    };
    const rotuloTipo = escaparHtml(TIPO_QUARTO[quarto.tipo] || quarto.tipo);
    const diariaFormatada = formatadorMoeda.format(Number(quarto.valorDiaria ?? 0));
    const numeroSeguro = escaparHtml(quarto.numero);

    // Sigilo estrito: exibe hóspede apenas quando status === 'OCUPADO' e houver hospedeAtual
    const hospedeHtml = quarto.status === 'OCUPADO' && quarto.hospedeAtual
        ? `<div class="pq-card-hospede">Hóspede: <strong>${escaparHtml(quarto.hospedeAtual)}</strong></div>`
        : '';

    let acoes = '';
    if (quarto.status === 'DISPONIVEL') {
        acoes = `
            <button type="button" class="pq-btn pq-btn-primario">${iconeSvg.checkin} Check-in</button>
            <button type="button" class="pq-btn pq-btn-info" aria-label="Detalhes do quarto ${numeroSeguro}">${iconeSvg.info}</button>
        `;
    } else if (quarto.status === 'OCUPADO') {
        acoes = `
            <button type="button" class="pq-btn pq-btn-contorno">${iconeSvg.ver} Ver quarto</button>
            <button type="button" class="pq-btn pq-btn-info" aria-label="Detalhes do quarto ${numeroSeguro}">${iconeSvg.info}</button>
        `;
    } else {
        // MANUTENCAO ou BLOQUEADO não possuem ações disponíveis
        acoes = '<span class="pq-sem-acoes">Sem ações disponíveis</span>';
    }

    return `
        <article class="pq-card">
            <div class="pq-card-topo">
                <span class="pq-card-numero">${numeroSeguro}</span>
                <span class="pq-badge pq-badge-${metaStatus.classe}">${iconeSvg[metaStatus.icone]} ${metaStatus.rotulo}</span>
            </div>
            <div class="pq-card-info">
                <div class="pq-card-tipo">${rotuloTipo}</div>
                <div class="pq-card-diaria">${diariaFormatada} <span>/ diária</span></div>
                ${hospedeHtml}
            </div>
            <div class="pq-card-acoes">${acoes}</div>
        </article>
    `;
}

function montarConteudoQuartos(quartosFiltrados) {
    if (quartos.length === 0) {
        return `
            <div class="pq-estado">
                <div class="pq-estado-titulo">Nenhum quarto encontrado no sistema.</div>
                <div class="pq-estado-texto">Não há quartos cadastrados na base de dados no momento.</div>
            </div>
        `;
    }

    if (quartosFiltrados.length === 0) {
        const mensagemVazio = MENSAGEM_FILTRO_VAZIO[filtroAtual] || 'Nenhum quarto encontrado para o filtro selecionado.';
        return `
            <div class="pq-estado">
                <div class="pq-estado-titulo">${mensagemVazio}</div>
                <div class="pq-estado-texto">Selecione outro filtro para visualizar os demais quartos.</div>
            </div>
        `;
    }

    return `
        <div class="pq-grid">
            ${quartosFiltrados.map(montarCard).join('')}
        </div>
    `;
}

function montarPainel() {
    const area = document.getElementById('painel-quartos-view');
    if (!area) return;

    if (carregando) {
        area.innerHTML = `
            <div class="pq-estado" role="status">
                <div class="pq-estado-titulo">Carregando painel de quartos...</div>
                <div class="pq-estado-texto">Buscando disponibilidade e contadores atualizados.</div>
            </div>
        `;
        return;
    }

    if (mensagemErro !== null) {
        area.innerHTML = `
            <div class="pq-estado pq-estado-erro" role="alert">
                <div class="pq-estado-titulo">Erro ao carregar painel de quartos</div>
                <div class="pq-estado-texto">${escaparHtml(mensagemErro)}</div>
                <button type="button" class="pq-btn pq-btn-primario pq-btn-tentar-novamente">Tentar novamente</button>
            </div>
        `;

        const botaoTentarNovamente = area.querySelector('.pq-btn-tentar-novamente');
        if (botaoTentarNovamente) {
            botaoTentarNovamente.addEventListener('click', carregarPainel);
        }
        return;
    }

    const quartosFiltrados = filtroAtual === 'TODOS'
        ? quartos
        : quartos.filter(q => q.status === filtroAtual);

    area.innerHTML = `
        <div class="pq-contadores">
            ${montarContador('total', 'TOTAL', contadores.total)}
            ${montarContador('livre', 'LIVRES', contadores.livres)}
            ${montarContador('ocupado', 'OCUPADOS', contadores.ocupados)}
            ${montarContador('manutencao', 'MANUTENÇÃO', contadores.manutencao)}
        </div>

        <div class="pq-filtros">
            Filtrar por:
            ${montarFiltro('Todos', contadores.total, 'TODOS')}
            ${montarFiltro('Livres', contadores.livres, 'DISPONIVEL')}
            ${montarFiltro('Ocupados', contadores.ocupados, 'OCUPADO')}
            ${montarFiltro('Em Manutenção', contadores.manutencao, 'MANUTENCAO')}
        </div>

        ${montarConteudoQuartos(quartosFiltrados)}
    `;

    // clicar em um filtro altera apenas filtroAtual em memória e re-renderiza sem novo fetch nem recálculo dos contadores
    area.querySelectorAll('.pq-filtro').forEach(botao => {
        botao.addEventListener('click', () => {
            filtroAtual = botao.dataset.filtro;
            montarPainel();
        });
    });
}

async function carregarPainel() {
    carregando = true;
    mensagemErro = null;
    montarPainel();

    try {
        const dados = await window.apiClient.get('/quartos/painel');
        const c = dados?.contadores || {};

        contadores = {
            total: Number(c.total ?? 0),
            livres: Number(c.livres ?? 0),
            ocupados: Number(c.ocupados ?? 0),
            manutencao: Number(c.manutencao ?? 0)
        };

        quartos = [...(dados?.quartos || [])].sort((a, b) =>
            String(a.numero).localeCompare(String(b.numero), 'pt-BR', { numeric: true })
        );
    } catch (erro) {
        mensagemErro = erro?.message || 'Não foi possível carregar os dados do painel.';
    } finally {
        carregando = false;
        montarPainel();
    }
}

// chamado pelo roteador: sempre começa mostrando todos
function renderizarPainelQuartos() {
    filtroAtual = 'TODOS';
    carregarPainel();
}

return { renderizar: renderizarPainelQuartos };

})();

// Painel de Quartos: monta os contadores e os cards dentro de #painel-quartos-view
// Chamado pelo roteador depois que a página é carregada: window.painelQuartos.renderizar()
// (tudo fica dentro da função abaixo para não misturar nomes com os outros arquivos)

window.painelQuartos = (function () {

const quartos = [
    { numero: '101', tipo: 'Casal Standard', status: 'livre' },
    { numero: '102', tipo: 'Casal Luxo', status: 'ocupado', hospede: 'Lucas Peixoto' },
    { numero: '103', tipo: 'Solteiro Executivo', status: 'manutencao' },
    { numero: '104', tipo: 'Suíte Executiva', status: 'ocupado', hospede: 'Helena Guimarães' },
    { numero: '105', tipo: 'Solteiro Executivo', status: 'livre' },
    { numero: '201', tipo: 'Suíte Vista Mar', status: 'livre' },
    { numero: '202', tipo: 'Duplo Solteiro', status: 'livre' },
    { numero: '203', tipo: 'Casal Superior', status: 'ocupado', hospede: 'Rodrigo Silveira' }
];

// filtro selecionado: 'todos', 'livre', 'ocupado' ou 'manutencao'
let filtroAtual = 'todos';

const rotulosStatus = {
    livre: 'Livre',
    ocupado: 'Ocupado',
    manutencao: 'Manutenção'
};

// ícones simples em svg 
const iconeSvg = {
    livre: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><path d="M5.5 8.2l1.8 1.8 3.2-3.6"/></svg>',
    ocupado: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5" r="2.5"/><path d="M3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5z"/></svg>',
    manutencao: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 2.5a3.5 3.5 0 0 0-3.3 4.7L2.5 12a1.4 1.4 0 0 0 2 2l4.8-4.7a3.5 3.5 0 0 0 4.7-3.3l-2 2-1.8-.5-.5-1.8z"/></svg>',
    checkin: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2.5h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3M2 8h8M7.5 5.2L10.3 8l-2.8 2.8"/></svg>',
    ver: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>',
    info: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 7.2V11M8 5v.01"/></svg>'
};

function contarPorStatus(status) {
    return quartos.filter(q => q.status === status).length;
}

function montarContador(status, titulo) {
    return `
        <div class="pq-contador pq-contador-${status}">
            <div>
                <div class="pq-contador-titulo">${titulo}</div>
                <div class="pq-contador-numero">${contarPorStatus(status)}</div>
            </div>
            <div class="pq-contador-icone">${iconeSvg[status]}</div>
        </div>
    `;
}

function montarFiltro(texto, quantidade, valor) {
    const ativo = filtroAtual === valor ? ' ativo' : '';
    return `<button type="button" class="pq-filtro${ativo}" data-filtro="${valor}">${texto} <span>${quantidade}</span></button>`;
}

function montarCard(quarto) {
    let info = '';
    let acoes = '';

    if (quarto.status === 'ocupado') {
        info = `<div class="pq-card-hospede">Hóspede: <strong>${quarto.hospede}</strong></div>`;
    }

    if (quarto.status === 'livre') {
        acoes = `<button type="button" class="pq-btn pq-btn-primario">${iconeSvg.checkin} Check-in</button>`;
    } else if (quarto.status === 'ocupado') {
        acoes = `<button type="button" class="pq-btn pq-btn-contorno">${iconeSvg.ver} Ver quarto</button>`;
    }

    // quarto em manutenção não tem ações
    if (quarto.status === 'manutencao') {
        acoes = '<span class="pq-sem-acoes">Sem ações disponíveis</span>';
    } else {
        acoes += `<button type="button" class="pq-btn pq-btn-info" aria-label="Detalhes do quarto ${quarto.numero}">${iconeSvg.info}</button>`;
    }

    return `
        <article class="pq-card">
            <div class="pq-card-topo">
                <span class="pq-card-numero">${quarto.numero}</span>
                <span class="pq-badge pq-badge-${quarto.status}">${iconeSvg[quarto.status]} ${rotulosStatus[quarto.status]}</span>
            </div>
            <div class="pq-card-info">
                <div class="pq-card-tipo">${quarto.tipo}</div>
                ${info}
            </div>
            <div class="pq-card-acoes">${acoes}</div>
        </article>
    `;
}

function montarPainel() {
    const area = document.getElementById('painel-quartos-view');
    if (!area) return;

    const quartosFiltrados = quartos.filter(q => filtroAtual === 'todos' || q.status === filtroAtual);

    area.innerHTML = `
        <div class="pq-contadores">
            ${montarContador('livre', 'LIVRES')}
            ${montarContador('ocupado', 'OCUPADOS')}
            ${montarContador('manutencao', 'MANUTENÇÃO')}
        </div>

        <div class="pq-filtros">
            Filtrar por:
            ${montarFiltro('Todos', quartos.length, 'todos')}
            ${montarFiltro('Livres', contarPorStatus('livre'), 'livre')}
            ${montarFiltro('Ocupados', contarPorStatus('ocupado'), 'ocupado')}
            ${montarFiltro('Manutenção', contarPorStatus('manutencao'), 'manutencao')}
        </div>

        <div class="pq-grid">
            ${quartosFiltrados.map(montarCard).join('')}
        </div>
    `;

    // clicar em um filtro guarda a escolha e monta o painel de novo
    area.querySelectorAll('.pq-filtro').forEach(botao => {
        botao.addEventListener('click', () => {
            filtroAtual = botao.dataset.filtro;
            montarPainel();
        });
    });
}

// chamado pelo roteador: sempre começa mostrando todos
function renderizarPainelQuartos() {
    filtroAtual = 'todos';
    montarPainel();
}

return { renderizar: renderizarPainelQuartos };

})();
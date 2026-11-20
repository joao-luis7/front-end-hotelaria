/**
 * roteador.js - Roteador SPA leve para alternância de visões sem recarregar o layout base
 * Conformidade com PB-28, PB-29 e CA-02 da spec.md
 */

const rotas = {
    'painel-quartos': {
        titulo: 'Painel de Quartos',
        desenvolvido: true,
        caminhoArquivo: 'quartos/pages/painel-quartos.html',
        perfisPermitidos: ['Recepcionista', 'Dono'],
        aoRenderizar: () => window.painelQuartos && window.painelQuartos.renderizar(),
        templateFallback: `
            <header class="cabecalho">
                <h2>Painel de Quartos</h2>
                <p class="mb-0 text-muted">
                    Visualização geral e controle de ocupação dos quartos.
                </p>
            </header>
            <section class="area-conteudo" id="painel-quartos-view">
                <div class="p-4 text-center text-muted">
                    <p class="mb-0">Carregando quartos...</p>
                </div>
            </section>
        `
    },
    'hospedes': {
        titulo: 'Hóspedes',
        desenvolvido: true,
        caminhoArquivo: 'hospedes/pages/gestao-hospedes.html',
        perfisPermitidos: ['Recepcionista', 'Dono'],
        aoRenderizar: () => window.gestaoHospedes && window.gestaoHospedes.renderizar(),
        templateFallback: `
            <section class="area-conteudo" id="gestao-hospedes-view">
                <header class="gh-cabecalho">
                    <div class="gh-cabecalho-textos">
                        <h2 class="gh-titulo">Hóspedes</h2>
                        <p class="gh-subtitulo">Cadastro e histórico dos hóspedes do hotel</p>
                    </div>
                    <div class="gh-cabecalho-acoes">
                        <button type="button" class="gh-btn-novo" id="btn-novo-hospede">
                            <span class="gh-btn-novo-icone" aria-hidden="true">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 1.5V10.5M1.5 6H10.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                            <span>Novo hóspede</span>
                        </button>
                    </div>
                </header>
                <div id="gh-feedback-topo"></div>
                <form class="gh-busca-form" id="form-busca-hospede" role="search" novalidate>
                    <div class="gh-busca-wrapper">
                        <span class="gh-busca-icone" aria-hidden="true">
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="7.2" cy="7.2" r="5.4" stroke="#72787D" stroke-width="1.6"/>
                                <path d="M11.2 11.2L14.4 14.4" stroke="#72787D" stroke-width="1.6" stroke-linecap="round"/>
                            </svg>
                        </span>
                        <input type="search" id="input-busca-hospede" class="gh-busca-input" placeholder="Buscar por nome ou CPF..." autocomplete="off" aria-label="Buscar por nome ou CPF">
                        <button type="button" id="btn-limpar-busca-hospede" class="gh-busca-limpar d-none" title="Limpar busca" aria-label="Limpar busca">&times;</button>
                    </div>
                </form>
                <div id="gh-conteudo-tabela"></div>
                <div class="modal fade" id="modal-cadastro-hospede" tabindex="-1" aria-labelledby="titulo-modal-cadastro-hospede" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered gh-modal-dialog">
                        <div class="modal-content gh-modal-content">
                            <div class="gh-modal-topo">
                                <h3 class="modal-title gh-modal-titulo" id="titulo-modal-cadastro-hospede">Novo hóspede</h3>
                                <button type="button" class="gh-modal-fechar" data-bs-dismiss="modal" aria-label="Fechar">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <path d="M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                            <p class="gh-modal-subtitulo">Preencha os dados para registrar um novo hóspede.</p>
                            <form id="form-cadastro-hospede" class="gh-modal-form" novalidate>
                                <div id="gh-alerta-modal"></div>
                                <div class="gh-campo-grupo">
                                    <label for="input-nome-hospede" class="gh-label">NOME COMPLETO</label>
                                    <input type="text" id="input-nome-hospede" name="nomeCompleto" class="gh-input" placeholder="Ex: Mariana Silva" maxlength="150" autocomplete="name" required>
                                    <div class="gh-erro-campo" id="erro-nome-hospede"></div>
                                </div>
                                <div class="gh-campo-grupo">
                                    <label for="input-cpf-hospede" class="gh-label">CPF</label>
                                    <input type="text" id="input-cpf-hospede" name="cpf" class="gh-input" placeholder="000.000.000-00" maxlength="14" inputmode="numeric" autocomplete="off" required>
                                    <div class="gh-erro-campo" id="erro-cpf-hospede"></div>
                                </div>
                                <div class="gh-campo-grupo">
                                    <label for="input-telefone-hospede" class="gh-label">TELEFONE</label>
                                    <input type="tel" id="input-telefone-hospede" name="telefone" class="gh-input" placeholder="(00) 00000-0000" maxlength="15" inputmode="tel" autocomplete="tel" required>
                                    <div class="gh-erro-campo" id="erro-telefone-hospede"></div>
                                </div>
                                <div class="gh-campo-grupo">
                                    <label for="input-email-hospede" class="gh-label">EMAIL <span class="gh-opcional">(opcional)</span></label>
                                    <input type="email" id="input-email-hospede" name="email" class="gh-input" placeholder="usuario@gmail.com" maxlength="150" autocomplete="email">
                                    <div class="gh-erro-campo" id="erro-email-hospede"></div>
                                </div>
                                <div class="gh-modal-footer">
                                    <button type="button" class="gh-btn-cancelar-modal" id="btn-cancelar-hospede" data-bs-dismiss="modal">Cancelar</button>
                                    <button type="submit" class="gh-btn-salvar-modal" id="btn-salvar-hospede">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        `
    },
    'check-in': {
        titulo: 'Check-in',
        desenvolvido: false
    },
    'pedidos': {
        titulo: 'Pedidos',
        desenvolvido: false
    }
};

class Roteador {
    constructor() {
        this.container = document.getElementById('app-conteudo');
        this.rotaPadrao = 'painel-quartos';
        this.iniciar();
    }

    iniciar() {
        window.addEventListener('hashchange', () => this.navegarParaRotaAtual());
        this.navegarParaRotaAtual();
    }

    obterRotaAtual() {
        const hash = window.location.hash.replace(/^#\/?/, '').trim();
        return rotas[hash] ? hash : this.rotaPadrao;
    }

    async navegarParaRotaAtual() {
        const rotaNome = this.obterRotaAtual();
        const config = rotas[rotaNome];

        this.atualizarLinksNavegacao(rotaNome);

        if (!this.usuarioPossuiAcesso(config)) {
            this.renderizarAcessoNegado();
            return;
        }

        if (!config || !config.desenvolvido) {
            this.renderizarModuloEmDesenvolvimento(config ? config.titulo : rotaNome);
            return;
        }

        await this.renderizarRota(config);
    }

    atualizarLinksNavegacao(rotaAtiva) {
        const links = document.querySelectorAll('.sidebar-nav-link');
        links.forEach(link => {
            const rota = link.getAttribute('data-route');
            if (rota === rotaAtiva) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    async renderizarRota(config) {
        if (!this.container) return;

        try {
            if (config.caminhoArquivo) {
                const resposta = await fetch(config.caminhoArquivo);
                if (resposta.ok) {
                    const html = await resposta.text();
                    this.container.innerHTML = html;
                    this.aposRenderizar(config);
                    return;
                }
            }
        } catch (erro) {
            // Se executando localmente sem servidor HTTP (file://) ou em caso de restrição,
            // renderiza o template de fallback com segurança e sem erros de console.
        }

        this.container.innerHTML = config.templateFallback;
        this.aposRenderizar(config);
    }

    // Scripts dentro do HTML carregado não executam, então a rota pode ter uma função de montagem
    aposRenderizar(config) {
        if (config.aoRenderizar) {
            config.aoRenderizar();
        }
    }

    renderizarModuloEmDesenvolvimento(tituloModulo) {
        if (!this.container) return;

        this.container.innerHTML = `
            <header class="cabecalho">
                <h2>${tituloModulo}</h2>
                <p class="mb-0 text-muted">
                    Gerencie as informações do seu hotel.
                </p>
            </header>

            <section class="area-conteudo">
                <div class="alert alert-info d-flex align-items-center gap-3 p-4 mb-0" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#002033" viewBox="0 0 16 16" class="flex-shrink-0">
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                    </svg>
                    <div>
                        <h5 class="alert-heading mb-1 text-dark">Módulo em desenvolvimento para as próximas etapas</h5>
                        <p class="mb-0 text-secondary">
                            Esta funcionalidade faz parte do planejamento de evolução do sistema e estará disponível em breve.
                        </p>
                    </div>
                </div>
            </section>
        `;
    }

    usuarioPossuiAcesso(config) {
        if (!config || !config.perfisPermitidos || config.perfisPermitidos.length === 0) {
            return true;
        }

        const perfilAtual = window.sessaoUsuario ? window.sessaoUsuario.obterPerfil() : localStorage.getItem('usuario_perfil');
        return Boolean(perfilAtual && config.perfisPermitidos.includes(perfilAtual));
    }

    renderizarAcessoNegado() {
        if (!this.container) return;

        this.container.innerHTML = `
            <header class="cabecalho">
                <h2>Acesso Restrito</h2>
                <p class="mb-0 text-muted">
                    Controle de permissões e segurança.
                </p>
            </header>

            <section class="area-conteudo">
                <div class="alert alert-danger d-flex align-items-center gap-3 p-4 mb-0" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#842029" viewBox="0 0 16 16" class="flex-shrink-0">
                        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/>
                    </svg>
                    <div>
                        <h5 class="alert-heading mb-1 text-dark">403 - Acesso Não Autorizado</h5>
                        <p class="mb-0 text-secondary">
                            Esta página é restrita apenas aos perfis de Dono e Recepcionista.
                        </p>
                    </div>
                </div>
            </section>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.roteador = new Roteador();
});
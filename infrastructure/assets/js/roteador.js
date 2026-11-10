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
        templateFallback: `
            <header class="cabecalho">
                <h2>Painel de Quartos</h2>
                <p class="mb-0 text-muted">
                    Visualização geral e controle de ocupação dos quartos.
                </p>
            </header>
            <section class="area-conteudo" id="painel-quartos-view">
                <div class="p-4 text-center text-muted">
                    <p class="mb-0">A visualização completa dos quartos e contadores será carregada aqui na próxima etapa.</p>
                </div>
            </section>
        `
    },
    'hospedes': {
        titulo: 'Hóspedes',
        desenvolvido: false
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
                    return;
                }
            }
        } catch (erro) {
            // Se executando localmente sem servidor HTTP (file://) ou em caso de restrição,
            // renderiza o template de fallback com segurança e sem erros de console.
        }

        this.container.innerHTML = config.templateFallback;
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

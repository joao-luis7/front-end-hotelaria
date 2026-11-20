/**
 * gestao-hospedes.js - Controlador da tela de Gestão de Hóspedes (PB-07 + PB-08)
 * Etapa Task 04: Listagem inicial da tabela, filtro por nome e busca rápida por CPF (GET /api/v1/hospedes/cpf/{cpf}).
 */
window.gestaoHospedes = (function () {
    'use strict';

    let hospedesCarregados = [];
    let termoBuscaAtual = '';
    let carregandoLista = false;
    let buscandoCpfNaApi = false;
    let erroCarregamentoLista = null;
    let resultadoBuscaCpf = null; // { tipo: 'ENCONTRADO' | 'NAO_ENCONTRADO' | 'ERRO', hospede?: Object, cpfLimpo?: string, mensagem?: string }
    let feedbackTopo = null; // { tipo: 'sucesso' | 'erro' | 'info', mensagem: string }
    let idHospedeDestacado = null;
    let instanciaModalBootstrap = null;
    let sequenciaBuscaCpf = 0;

    const iconeSvg = {
        editar: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.3 2.3a1.5 1.5 0 0 1 2.1 2.1L5 12.8l-3 .7.7-3 8.6-8.2z"/></svg>',
        lixeira: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4h11M5.5 4V2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4M6.5 7v4.5M9.5 7v4.5M3.8 4l.6 9.2a1.2 1.2 0 0 0 1.2 1.1h4.8a1.2 1.2 0 0 0 1.2-1.1L12.2 4"/></svg>',
        usuarioNaoEncontrado: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="6.5" r="3.2"/><path d="M2.8 16.5c0-3 2.5-5 5.7-5 1.1 0 2.1.3 3 .8"/><path d="M14 12.5l4 4M18 12.5l-4 4"/></svg>',
        mais: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 1.5V10.5M1.5 6H10.5"/></svg>'
    };

    function escaparHtml(valor) {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function ordenarPorNome(lista) {
        return [...lista].sort((a, b) =>
            String(a.nomeCompleto || a.nome || '').localeCompare(
                String(b.nomeCompleto || b.nome || ''),
                'pt-BR',
                { sensitivity: 'base' }
            )
        );
    }

    function mesclarHospedeNaLista(hospede) {
        if (!hospede || hospede.id == null) return;
        const indiceExistente = hospedesCarregados.findIndex(h => Number(h.id) === Number(hospede.id));
        if (indiceExistente >= 0) {
            hospedesCarregados[indiceExistente] = hospede;
        } else {
            hospedesCarregados.push(hospede);
        }
        hospedesCarregados = ordenarPorNome(hospedesCarregados);
    }

    function renderizarFeedbackTopo() {
        const container = document.getElementById('gh-feedback-topo');
        if (!container) return;

        if (!feedbackTopo) {
            container.innerHTML = '';
            return;
        }

        const classeTipo = feedbackTopo.tipo === 'sucesso'
            ? 'gh-alerta-sucesso'
            : (feedbackTopo.tipo === 'erro' ? 'gh-alerta-erro' : 'gh-alerta-info');

        container.innerHTML = `
            <div class="gh-alerta ${classeTipo}" role="alert">
                <span>${escaparHtml(feedbackTopo.mensagem)}</span>
                <button type="button" class="gh-alerta-fechar" aria-label="Fechar aviso">&times;</button>
            </div>
        `;

        const botaoFechar = container.querySelector('.gh-alerta-fechar');
        if (botaoFechar) {
            botaoFechar.addEventListener('click', () => {
                feedbackTopo = null;
                renderizarFeedbackTopo();
            });
        }
    }

    function montarBadgeSituacao(ativo) {
        if (ativo) {
            return `
                <span class="gh-badge gh-badge-ativo">
                    <span class="gh-badge-ponto" aria-hidden="true"></span>
                    Ativo
                </span>
            `;
        }
        return `
            <span class="gh-badge gh-badge-inativo">
                <span class="gh-badge-ponto" aria-hidden="true"></span>
                Inativo
            </span>
        `;
    }

    function montarLinhaHospede(hospede) {
        const id = Number(hospede.id);
        const nomeSeguro = escaparHtml(hospede.nomeCompleto || hospede.nome || '');
        const cpfFormatado = escaparHtml(window.hospedeService.formatarCpf(hospede.cpf));
        const telefoneFormatado = escaparHtml(window.hospedeService.formatarTelefone(hospede.telefone));
        const emailHtml = hospede.email
            ? `<span class="gh-email-hospede">${escaparHtml(hospede.email)}</span>`
            : '';
        const classeDestaque = Number(idHospedeDestacado) === id ? ' class="gh-linha-destaque"' : '';

        return `
            <tr${classeDestaque} data-hospede-id="${id}">
                <td>
                    <span class="gh-nome-hospede">${nomeSeguro}</span>
                    ${emailHtml}
                </td>
                <td>${cpfFormatado}</td>
                <td>${telefoneFormatado}</td>
                <td>${montarBadgeSituacao(Boolean(hospede.ativo))}</td>
                <td class="gh-col-acoes">
                    <div class="gh-acoes-grupo">
                        <button
                            type="button"
                            class="gh-btn-acao"
                            data-acao="editar-hospede"
                            data-id="${id}"
                            title="Editar hóspede"
                            aria-label="Editar hóspede ${nomeSeguro}"
                        >
                            ${iconeSvg.editar}
                        </button>
                        <button
                            type="button"
                            class="gh-btn-acao gh-btn-acao-inativar"
                            data-acao="inativar-hospede"
                            data-id="${id}"
                            title="${hospede.ativo ? 'Inativar hóspede' : 'Hóspede inativo'}"
                            aria-label="Inativar hóspede ${nomeSeguro}"
                            ${!hospede.ativo ? 'disabled' : ''}
                        >
                            ${iconeSvg.lixeira}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    function montarTabelaHtml(listaHospedes) {
        return `
            <div class="gh-tabela-card">
                <div class="gh-tabela-responsiva">
                    <table class="gh-tabela">
                        <thead>
                            <tr>
                                <th scope="col">NOME</th>
                                <th scope="col">CPF</th>
                                <th scope="col">TELEFONE</th>
                                <th scope="col">SITUAÇÃO</th>
                                <th scope="col" class="gh-col-acoes">AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${listaHospedes.map(montarLinhaHospede).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function filtrarHospedesEmMemoria() {
        const termo = termoBuscaAtual.trim();
        if (!termo) return hospedesCarregados;

        const termoMinusculo = termo.toLowerCase();
        const digitosBusca = window.hospedeService.sanitizarCpf(termo);

        return hospedesCarregados.filter(hospede => {
            const nome = String(hospede.nomeCompleto || hospede.nome || '').toLowerCase();
            const cpfLimpo = window.hospedeService.sanitizarCpf(hospede.cpf);
            const cpfFormatado = window.hospedeService.formatarCpf(hospede.cpf).toLowerCase();

            const bateNome = nome.includes(termoMinusculo);
            const bateCpfFormatado = cpfFormatado.includes(termoMinusculo);
            const bateCpfDigitos = digitosBusca.length > 0 && cpfLimpo.includes(digitosBusca);

            return bateNome || bateCpfFormatado || bateCpfDigitos;
        });
    }

    function renderizarConteudoTabela() {
        const container = document.getElementById('gh-conteudo-tabela');
        if (!container) return;

        if (carregandoLista || buscandoCpfNaApi) {
            const textoLoading = buscandoCpfNaApi
                ? 'Consultando CPF na base de hóspedes...'
                : 'Consultando fichas cadastrais do hotel.';
            container.innerHTML = `
                <div class="gh-estado" role="status">
                    <div class="gh-estado-titulo">Carregando hóspedes...</div>
                    <div class="gh-estado-texto">${escaparHtml(textoLoading)}</div>
                </div>
            `;
            return;
        }

        if (erroCarregamentoLista) {
            container.innerHTML = `
                <div class="gh-estado gh-estado-erro" role="alert">
                    <div class="gh-estado-titulo">Erro ao carregar lista de hóspedes</div>
                    <div class="gh-estado-texto">${escaparHtml(erroCarregamentoLista)}</div>
                    <button type="button" class="gh-btn gh-btn-primario mt-2" id="btn-tentar-novamente-hospedes">
                        Tentar novamente
                    </button>
                </div>
            `;
            const botaoTentar = document.getElementById('btn-tentar-novamente-hospedes');
            if (botaoTentar) {
                botaoTentar.addEventListener('click', carregarHospedes);
            }
            return;
        }

        // Resultado direto da busca rápida por CPF (PB-08 -> GET /api/v1/hospedes/cpf/{cpf})
        if (resultadoBuscaCpf) {
            if (resultadoBuscaCpf.tipo === 'ENCONTRADO' && resultadoBuscaCpf.hospede) {
                container.innerHTML = montarTabelaHtml([resultadoBuscaCpf.hospede]);
                return;
            }

            if (resultadoBuscaCpf.tipo === 'NAO_ENCONTRADO') {
                const cpfFormatado = window.hospedeService.formatarCpf(resultadoBuscaCpf.cpfLimpo);
                container.innerHTML = `
                    <div class="gh-estado gh-estado-404" role="region" aria-label="Resultado da busca por CPF">
                        <div class="gh-estado-icone" aria-hidden="true">${iconeSvg.usuarioNaoEncontrado}</div>
                        <div class="gh-estado-titulo">${escaparHtml(resultadoBuscaCpf.mensagem)}</div>
                        <div class="gh-estado-texto">
                            O CPF <strong>${escaparHtml(cpfFormatado)}</strong> ainda não possui ficha cadastrada. Você pode registrá-lo agora aproveitando o CPF digitado.
                        </div>
                        <button
                            type="button"
                            class="gh-btn gh-btn-primario gh-btn-atalho-cadastro"
                            id="btn-atalho-cadastrar-cpf"
                            data-cpf="${escaparHtml(resultadoBuscaCpf.cpfLimpo)}"
                        >
                            ${iconeSvg.mais}
                            <span>Novo hóspede com CPF ${escaparHtml(cpfFormatado)}</span>
                        </button>
                    </div>
                `;

                const botaoAtalho = document.getElementById('btn-atalho-cadastrar-cpf');
                if (botaoAtalho) {
                    botaoAtalho.addEventListener('click', () => {
                        abrirModalCadastro(botaoAtalho.getAttribute('data-cpf'));
                    });
                }
                return;
            }

            if (resultadoBuscaCpf.tipo === 'ERRO') {
                container.innerHTML = `
                    <div class="gh-estado gh-estado-erro" role="alert">
                        <div class="gh-estado-titulo">Não foi possível concluir a busca por CPF</div>
                        <div class="gh-estado-texto">${escaparHtml(resultadoBuscaCpf.mensagem)}</div>
                    </div>
                `;
                return;
            }
        }

        if (hospedesCarregados.length === 0) {
            container.innerHTML = `
                <div class="gh-estado">
                    <div class="gh-estado-titulo">Nenhum hóspede cadastrado no momento.</div>
                    <div class="gh-estado-texto">Clique em "+ Novo hóspede" no topo da página para registrar o primeiro cliente.</div>
                </div>
            `;
            return;
        }

        const filtrados = filtrarHospedesEmMemoria();
        if (filtrados.length === 0) {
            const ehCpfCompleto = window.hospedeService.ehBuscaPorCpf(termoBuscaAtual);
            const cpfLimpo = window.hospedeService.sanitizarCpf(termoBuscaAtual);
            const atalhoHtml = ehCpfCompleto
                ? `
                    <button
                        type="button"
                        class="gh-btn gh-btn-primario gh-btn-atalho-cadastro"
                        id="btn-atalho-filtro-vazio"
                        data-cpf="${escaparHtml(cpfLimpo)}"
                    >
                        ${iconeSvg.mais}
                        <span>Cadastrar hóspede com CPF ${escaparHtml(window.hospedeService.formatarCpf(cpfLimpo))}</span>
                    </button>
                `
                : '';

            container.innerHTML = `
                <div class="gh-estado">
                    <div class="gh-estado-titulo">Nenhum hóspede encontrado para "${escaparHtml(termoBuscaAtual.trim())}".</div>
                    <div class="gh-estado-texto">Verifique o termo digitado ou cadastre um novo hóspede.</div>
                    ${atalhoHtml}
                </div>
            `;

            const botaoAtalhoFiltro = document.getElementById('btn-atalho-filtro-vazio');
            if (botaoAtalhoFiltro) {
                botaoAtalhoFiltro.addEventListener('click', () => {
                    abrirModalCadastro(botaoAtalhoFiltro.getAttribute('data-cpf'));
                });
            }
            return;
        }

        container.innerHTML = montarTabelaHtml(filtrados);
    }

    /**
     * Executa a busca rápida por CPF na API: GET /api/v1/hospedes/cpf/{cpf} (PB-08)
     * Trata 200 OK (ativos e inativos) e 404 Not Found (CA-10 com atalho para o modal).
     * @param {string} cpfInformado
     */
    async function executarBuscaPorCpf(cpfInformado) {
        const cpfLimpo = window.hospedeService.sanitizarCpf(cpfInformado);
        if (cpfLimpo.length !== 11) return;

        const idRequisicao = ++sequenciaBuscaCpf;
        buscandoCpfNaApi = true;
        resultadoBuscaCpf = null;
        renderizarConteudoTabela();

        try {
            const hospede = await window.hospedeService.buscarPorCpf(cpfLimpo);
            if (idRequisicao !== sequenciaBuscaCpf) return;

            mesclarHospedeNaLista(hospede);
            idHospedeDestacado = hospede.id;
            resultadoBuscaCpf = {
                tipo: 'ENCONTRADO',
                hospede,
                cpfLimpo
            };
        } catch (erro) {
            if (idRequisicao !== sequenciaBuscaCpf) return;

            if (erro && erro.status === 404) {
                idHospedeDestacado = null;
                resultadoBuscaCpf = {
                    tipo: 'NAO_ENCONTRADO',
                    cpfLimpo,
                    mensagem: erro.message || 'Nenhum hóspede encontrado para o CPF informado'
                };
            } else {
                resultadoBuscaCpf = {
                    tipo: 'ERRO',
                    cpfLimpo,
                    mensagem: erro?.message || 'Erro ao buscar hóspede pelo CPF informado.'
                };
            }
        } finally {
            if (idRequisicao === sequenciaBuscaCpf) {
                buscandoCpfNaApi = false;
                renderizarConteudoTabela();
            }
        }
    }

    async function carregarHospedes() {
        carregandoLista = true;
        erroCarregamentoLista = null;
        renderizarConteudoTabela();

        try {
            const lista = await window.hospedeService.listar();
            hospedesCarregados = ordenarPorNome(lista);
        } catch (erro) {
            erroCarregamentoLista = erro?.message || 'Não foi possível carregar os hóspedes cadastrados.';
        } finally {
            carregandoLista = false;
            renderizarConteudoTabela();
        }
    }

    function obterInstanciaModal() {
        const elementoModal = document.getElementById('modal-cadastro-hospede');
        if (!elementoModal) return null;

        if (window.bootstrap && window.bootstrap.Modal) {
            instanciaModalBootstrap = window.bootstrap.Modal.getOrCreateInstance(elementoModal);
            return instanciaModalBootstrap;
        }
        return null;
    }

    /**
     * Abre o Modal "+ Novo hóspede", opcionalmente pré-preenchendo o CPF (CA-10).
     * @param {string} [cpfPrePreenchido='']
     */
    function abrirModalCadastro(cpfPrePreenchido = '') {
        const form = document.getElementById('form-cadastro-hospede');
        if (form) form.reset();

        const inputNome = document.getElementById('input-nome-hospede');
        const inputCpf = document.getElementById('input-cpf-hospede');
        const inputTelefone = document.getElementById('input-telefone-hospede');
        const inputEmail = document.getElementById('input-email-hospede');

        if (inputNome) inputNome.value = '';
        if (inputTelefone) inputTelefone.value = '';
        if (inputEmail) inputEmail.value = '';

        const cpfFormatado = cpfPrePreenchido
            ? window.hospedeService.formatarCpf(cpfPrePreenchido)
            : '';

        if (inputCpf) {
            inputCpf.value = cpfFormatado;
        }

        const modal = obterInstanciaModal();
        if (modal) {
            modal.show();
        } else {
            const elModal = document.getElementById('modal-cadastro-hospede');
            if (elModal) {
                elModal.classList.add('show');
                elModal.style.display = 'block';
                elModal.removeAttribute('aria-hidden');
            }
        }

        setTimeout(() => {
            if (inputNome) inputNome.focus();
        }, 120);
    }

    function atualizarBotaoLimparBusca() {
        const btnLimpar = document.getElementById('btn-limpar-busca-hospede');
        if (!btnLimpar) return;
        if (termoBuscaAtual.trim().length > 0) {
            btnLimpar.classList.remove('d-none');
        } else {
            btnLimpar.classList.add('d-none');
        }
    }

    function configurarEventos() {
        const btnNovoHospede = document.getElementById('btn-novo-hospede');
        if (btnNovoHospede) {
            btnNovoHospede.addEventListener('click', () => abrirModalCadastro(''));
        }

        const inputBusca = document.getElementById('input-busca-hospede');
        const formBusca = document.getElementById('form-busca-hospede');
        const btnLimparBusca = document.getElementById('btn-limpar-busca-hospede');

        if (inputBusca) {
            inputBusca.addEventListener('input', () => {
                const valorBruto = inputBusca.value;

                if (/^\d{11}$/.test(valorBruto.trim())) {
                    inputBusca.value = window.hospedeService.formatarCpf(valorBruto.trim());
                }

                termoBuscaAtual = inputBusca.value;
                atualizarBotaoLimparBusca();

                if (window.hospedeService.ehBuscaPorCpf(termoBuscaAtual)) {
                    executarBuscaPorCpf(termoBuscaAtual);
                } else {
                    sequenciaBuscaCpf++;
                    buscandoCpfNaApi = false;
                    resultadoBuscaCpf = null;
                    renderizarConteudoTabela();
                }
            });
        }

        if (formBusca) {
            formBusca.addEventListener('submit', (evento) => {
                evento.preventDefault();
                if (!inputBusca) return;

                termoBuscaAtual = inputBusca.value;
                if (window.hospedeService.ehBuscaPorCpf(termoBuscaAtual)) {
                    executarBuscaPorCpf(termoBuscaAtual);
                } else if (window.hospedeService.ehFormatoCpfParcialOuCompleto(termoBuscaAtual)) {
                    feedbackTopo = {
                        tipo: 'info',
                        mensagem: 'Para buscar uma ficha exata por CPF na base, digite os 11 dígitos do CPF.'
                    };
                    renderizarFeedbackTopo();
                    renderizarConteudoTabela();
                } else {
                    resultadoBuscaCpf = null;
                    renderizarConteudoTabela();
                }
            });
        }

        if (btnLimparBusca) {
            btnLimparBusca.addEventListener('click', () => {
                sequenciaBuscaCpf++;
                termoBuscaAtual = '';
                resultadoBuscaCpf = null;
                idHospedeDestacado = null;
                if (inputBusca) {
                    inputBusca.value = '';
                    inputBusca.focus();
                }
                atualizarBotaoLimparBusca();
                renderizarConteudoTabela();
            });
        }
    }

    function renderizar() {
        termoBuscaAtual = '';
        resultadoBuscaCpf = null;
        feedbackTopo = null;
        idHospedeDestacado = null;
        configurarEventos();
        renderizarFeedbackTopo();
        carregarHospedes();
    }

    return {
        renderizar,
        carregarHospedes,
        executarBuscaPorCpf,
        abrirModalCadastro
    };
})();

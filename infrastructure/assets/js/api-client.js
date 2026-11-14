/**
 * api-client.js - Cliente HTTP centralizado para comunicação com a API REST
 */
(function (global) {
    'use strict';

    const BASE_URL = (global.API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/+$/, '');

    /**
     * Executa uma requisição HTTP usando fetch e padroniza tratamento de erros.
     * @param {string} caminho - Caminho relativo ao BASE_URL (ex.: '/quartos/painel').
     * @param {RequestInit} [opcoes={}] - Opções adicionais do fetch.
     * @returns {Promise<any>} JSON parseado ou null em respostas 204.
     */
    async function requisitar(caminho, opcoes = {}) {
        const sufixo = caminho.startsWith('/') ? caminho : `/${caminho}`;
        const url = `${BASE_URL}${sufixo}`;

        const cabecalhos = Object.assign(
            { Accept: 'application/json' },
            opcoes.body !== undefined ? { 'Content-Type': 'application/json' } : {},
            opcoes.headers || {}
        );

        const config = Object.assign({}, opcoes, { headers: cabecalhos });

        let resposta;
        try {
            resposta = await fetch(url, config);
        } catch (_falhaRede) {
            const erroRede = new Error(
                'Não foi possível conectar ao servidor. Verifique se o back-end está em execução.'
            );
            erroRede.status = 0;
            throw erroRede;
        }

        if (!resposta.ok) {
            const dadosErro = await resposta.json().catch(() => null);
            const mensagemApi = dadosErro && (dadosErro.mensagem || dadosErro.message || dadosErro.erro);

            let mensagem;
            if (resposta.status === 401) {
                mensagem = 'Sessão não autenticada (401).';
            } else if (resposta.status === 403) {
                mensagem = 'Acesso negado para o perfil atual (403).';
            } else {
                mensagem = mensagemApi || `Erro ao comunicar com o servidor (HTTP ${resposta.status}).`;
            }

            const erroHttp = new Error(mensagem);
            erroHttp.status = resposta.status;
            throw erroHttp;
        }

        if (resposta.status === 204) {
            return null;
        }

        return await resposta.json();
    }

    function serializarCorpo(corpo) {
        if (corpo === undefined) {
            return undefined;
        }
        return typeof corpo === 'string' ? corpo : JSON.stringify(corpo);
    }

    global.apiClient = {
        BASE_URL,

        /**
         * Executa uma requisição GET.
         * @param {string} caminho
         * @returns {Promise<any>}
         */
        get(caminho) {
            return requisitar(caminho, { method: 'GET' });
        },

        /**
         * Executa uma requisição POST com corpo JSON.
         * @param {string} caminho
         * @param {any} corpo
         * @returns {Promise<any>}
         */
        post(caminho, corpo) {
            return requisitar(caminho, {
                method: 'POST',
                body: serializarCorpo(corpo)
            });
        },

        /**
         * Executa uma requisição PATCH com corpo JSON.
         * @param {string} caminho
         * @param {any} corpo
         * @returns {Promise<any>}
         */
        patch(caminho, corpo) {
            return requisitar(caminho, {
                method: 'PATCH',
                body: serializarCorpo(corpo)
            });
        }
    };
})(window);

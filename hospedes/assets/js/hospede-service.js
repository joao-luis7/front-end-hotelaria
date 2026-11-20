/**
 * hospede-service.js - Serviço isolado de domínio e integração HTTP para Hóspedes (PB-07 + PB-08)
 * Reutilizável pela tela de Gestão de Hóspedes e pelo Passo 2 do Wizard de Check-in (PB-14/15).
 */
(function (global) {
    'use strict';

    const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /**
     * Remove todos os caracteres não numéricos e limita a 11 dígitos.
     * @param {string} valor
     * @returns {string}
     */
    function sanitizarCpf(valor) {
        return String(valor ?? '').replace(/\D/g, '').slice(0, 11);
    }

    /**
     * Aplica máscara progressiva de CPF (000.000.000-00).
     * @param {string} valor
     * @returns {string}
     */
    function formatarCpf(valor) {
        const digitos = sanitizarCpf(valor);
        if (digitos.length <= 3) return digitos;
        if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
        if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
        return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`;
    }

    /**
     * Remove todos os caracteres não numéricos do telefone e limita a 11 dígitos.
     * @param {string} valor
     * @returns {string}
     */
    function sanitizarTelefone(valor) {
        return String(valor ?? '').replace(/\D/g, '').slice(0, 11);
    }

    /**
     * Aplica máscara progressiva de telefone fixo ou celular: (00) 0000-0000 ou (00) 00000-0000.
     * @param {string} valor
     * @returns {string}
     */
    function formatarTelefone(valor) {
        const digitos = sanitizarTelefone(valor);
        if (digitos.length === 0) return '';
        if (digitos.length <= 2) return `(${digitos}`;
        if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
        if (digitos.length <= 10) {
            return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6, 10)}`;
        }
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7, 11)}`;
    }

    /**
     * Verifica se o termo digitado contém apenas caracteres compatíveis com CPF (dígitos, ponto, hífen e espaço).
     * @param {string} termo
     * @returns {boolean}
     */
    function ehFormatoCpfParcialOuCompleto(termo) {
        const texto = String(termo ?? '').trim();
        if (!texto) return false;
        return /^[\d.\-\s]+$/.test(texto) && /\d/.test(texto);
    }

    /**
     * Verifica se o termo digitado na barra de busca representa um CPF completo (11 dígitos, com ou sem máscara).
     * @param {string} termo
     * @returns {boolean}
     */
    function ehBuscaPorCpf(termo) {
        if (!ehFormatoCpfParcialOuCompleto(termo)) return false;
        return sanitizarCpf(termo).length === 11;
    }

    /**
     * Valida e-mail opcional: retorna true se estiver vazio/nulo ou se tiver sintaxe válida.
     * @param {string|null|undefined} email
     * @returns {boolean}
     */
    function validarEmail(email) {
        const texto = String(email ?? '').trim();
        if (!texto) return true;
        return REGEX_EMAIL.test(texto);
    }

    /**
     * Valida os campos do formulário de cadastro de hóspede (PB-07) e monta o payload sanitizado.
     * Campos obrigatórios: nomeCompleto, cpf (11 dígitos) e telefone (10 ou 11 dígitos).
     * Campo opcional: email (validado apenas se preenchido).
     * @param {{ nomeCompleto?: string, cpf?: string, telefone?: string, email?: string }} dados
     * @returns {{ valido: boolean, erros: Record<string, string>, payload: { nomeCompleto: string, cpf: string, telefone: string, email: string|null } }}
     */
    function validarDadosCadastro(dados = {}) {
        const nomeCompleto = String(dados.nomeCompleto ?? '').trim();
        const cpfLimpo = sanitizarCpf(dados.cpf);
        const telefoneLimpo = sanitizarTelefone(dados.telefone);
        const emailTexto = String(dados.email ?? '').trim();
        const erros = {};

        if (!nomeCompleto) {
            erros.nomeCompleto = 'O nome completo é obrigatório.';
        } else if (nomeCompleto.length < 3) {
            erros.nomeCompleto = 'Informe o nome e sobrenome do hóspede.';
        }

        if (!cpfLimpo) {
            erros.cpf = 'O CPF é obrigatório.';
        } else if (cpfLimpo.length !== 11) {
            erros.cpf = 'O CPF deve conter exatamente 11 dígitos numéricos.';
        }

        if (!telefoneLimpo) {
            erros.telefone = 'O telefone é obrigatório.';
        } else if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
            erros.telefone = 'Informe um telefone válido com DDD (10 ou 11 dígitos).';
        }

        if (emailTexto && !validarEmail(emailTexto)) {
            erros.email = 'Formato de e-mail inválido.';
        }

        return {
            valido: Object.keys(erros).length === 0,
            erros,
            payload: {
                nomeCompleto,
                cpf: cpfLimpo,
                telefone: telefoneLimpo,
                email: emailTexto ? emailTexto : null
            }
        };
    }

    /**
     * Cadastra um novo hóspede via POST /api/v1/hospedes (PB-07).
     * @param {{ nomeCompleto: string, cpf: string, telefone: string, email?: string|null }} dados
     * @returns {Promise<{ id: number, nomeCompleto: string, cpf: string, telefone: string, email: string|null, ativo: boolean }>}
     */
    async function cadastrar(dados) {
        const payload = {
            nomeCompleto: String(dados?.nomeCompleto ?? '').trim(),
            cpf: sanitizarCpf(dados?.cpf),
            telefone: sanitizarTelefone(dados?.telefone),
            email: dados?.email && String(dados.email).trim() ? String(dados.email).trim() : null
        };
        return await global.apiClient.post('/hospedes', payload);
    }

    /**
     * Busca rapidamente um hóspede pelo CPF via GET /api/v1/hospedes/cpf/{cpf} (PB-08).
     * Aceita CPF com ou sem pontuação e envia apenas os 11 dígitos numéricos na URL.
     * Função reutilizável pelo Passo 2 do Wizard de Check-in (PB-14/15).
     * @param {string} cpf - CPF com ou sem máscara (000.000.000-00 ou 00000000000).
     * @returns {Promise<{ id: number, nomeCompleto: string, cpf: string, telefone: string, email: string|null, ativo: boolean }>}
     */
    async function buscarPorCpf(cpf) {
        const cpfLimpo = sanitizarCpf(cpf);
        if (cpfLimpo.length !== 11) {
            const erroValidacao = new Error('O CPF para busca deve conter 11 dígitos numéricos.');
            erroValidacao.status = 400;
            throw erroValidacao;
        }
        return await global.apiClient.get(`/hospedes/cpf/${encodeURIComponent(cpfLimpo)}`);
    }

    /**
     * Lista os hóspedes cadastrados via GET /api/v1/hospedes.
     * @returns {Promise<Array<{ id: number, nomeCompleto: string, cpf: string, telefone: string, email: string|null, ativo: boolean }>>}
     */
    async function listar() {
        const resposta = await global.apiClient.get('/hospedes');
        return Array.isArray(resposta) ? resposta : [];
    }

    global.hospedeService = {
        sanitizarCpf,
        formatarCpf,
        sanitizarTelefone,
        formatarTelefone,
        ehFormatoCpfParcialOuCompleto,
        ehBuscaPorCpf,
        validarEmail,
        validarDadosCadastro,
        cadastrar,
        buscarPorCpf,
        listar
    };
})(window);

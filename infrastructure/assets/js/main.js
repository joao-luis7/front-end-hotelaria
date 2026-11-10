const SessaoUsuario = {
    CHAVE_STORAGE: 'usuario_perfil',
    PERFIL_PADRAO: 'Recepcionista',

    obterPerfil() {
        return localStorage.getItem(this.CHAVE_STORAGE) || this.PERFIL_PADRAO;
    },

    definirPerfil(perfil) {
        localStorage.setItem(this.CHAVE_STORAGE, perfil);
        this.sincronizarUI();
    },

    obterIniciais(nome) {
        if (!nome) return 'RC';
        const partes = nome.trim().split(/\s+/);
        if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    },

    sincronizarUI() {
        const perfil = this.obterPerfil();
        const elementoNome = document.querySelector('.sidebar-user-name');
        const elementoAvatar = document.querySelector('.sidebar-user-avatar');

        if (elementoNome) elementoNome.textContent = perfil;
        if (elementoAvatar) elementoAvatar.textContent = this.obterIniciais(perfil);
    },

    iniciar() {
        if (!localStorage.getItem(this.CHAVE_STORAGE)) {
            localStorage.setItem(this.CHAVE_STORAGE, this.PERFIL_PADRAO);
        }
        this.sincronizarUI();
    }
};

function atualizarDataAtual() {
    const elementoData = document.getElementById('data-atual');
    if (!elementoData) return;

    elementoData.textContent = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date());
}

document.addEventListener('DOMContentLoaded', () => {
    window.sessaoUsuario = SessaoUsuario;
    window.sessaoUsuario.iniciar();
    atualizarDataAtual();
});

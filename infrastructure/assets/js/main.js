// Inicialização da aplicação e conformidade com spec.md
document.addEventListener('DOMContentLoaded', () => {
    // PB-28: Sessão simulada automática para o perfil 'Recepcionista'
    if (!localStorage.getItem('usuario_perfil')) {
        localStorage.setItem('usuario_perfil', 'Recepcionista');
    }
});

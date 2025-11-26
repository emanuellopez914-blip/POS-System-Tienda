// login.js - Solo para la página de login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('login-message');

    // Verificar si ya está autenticado
    checkAuthentication();

    async function checkAuthentication() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();
            
            if (data.user) {
                // Ya está autenticado, redirigir al dashboard
                window.location.href = '/';
            }
        } catch (error) {
            console.log('No autenticado, mostrar formulario de login');
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                messageDiv.textContent = '✅ Login exitoso, redirigiendo...';
                messageDiv.className = 'success';
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                messageDiv.textContent = '❌ ' + data.error;
                messageDiv.className = 'error';
            }
        } catch (error) {
            messageDiv.textContent = '❌ Error de conexión';
            messageDiv.className = 'error';
        }
    });
});
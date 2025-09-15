    /* funcion mostrar contrseña carrito */
    function ocultarMostrar() {
      const input = document.getElementById('Clave');
      const btn   = document.getElementById('toggle');

      if (input.type == 'password') {
        input.type = 'text';        // 👁️ Muestra la contraseña
        btn.textContent = '👁️';
      } else {
        input.type = 'password';    // 🔒 La vuelve a ocultar
        btn.textContent = '🔒';
      }
    }




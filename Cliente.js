    /* funcion mostrar contrseña carrito */
    function ocultarMostrar() {
      const input = document.getElementById('Clave');
      const btn   = document.getElementById('toggle');
      const icono  = document.getElementById('iconoOjo');

      if (input.type == 'password') {
        input.type = 'text';        // 👁️ Muestra la contraseña
        icono.src  = 'css/img/Ojo.png';
      } else {
        input.type = 'password';    // 🔒 La vuelve a ocultar
        btn.textContent = 'css/img/Ocultar.png';
      }
    }




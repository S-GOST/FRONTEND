 /* funcion de ocultar contraseña carrito */
 const input = document.getElementById('Clave');
  const btn   = document.getElementById('toggle');

  btn.addEventListener('click', () => { /* funciona a hacer click */
    if (input.type == 'password') { /* Si es contraseña pasa eso */
      input.type = 'text'; /* cambia a texto */
      btn.textContent = '🔒';  // ojo cerrado
    } else {
      input.type = 'password'; /* Cambia a contraseña */
      btn.textContent = '👁️';  // ojo abierto
    }
  });




document.addEventListener("DOMContentLoaded", () => {
    const botones = document.querySelectorAll(".btn");

    botones.forEach(btn => {
      btn.addEventListener("click", () => {
        btn.classList.toggle("active"); 
      });
    });
  });

import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { clearSession } from '../../services/auth.services';
import rock from "../../assets/icons/rock.png";
import './Panel.css';

const Panel: React.FC = () => {
    // Obtener nombre del usuario desde localStorage (de la BD)
    const userName = localStorage.getItem('user_name') || 'ADMIN KTM';
    const userRole = localStorage.getItem('user_role') || 'admin';



    const handleLogout = () => {
        Swal.fire({
            title: "¿Salir del sistema?",
            text: "Tu sesión será cerrada.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#FF6D1F",
            cancelButtonColor: "#333",
            confirmButtonText: "Sí, salir",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                clearSession();
            }
        });
    };

    return (
        <div className="panel-container notranslate" translate="no">
            {/* HEADER */}
            <header className="d-flex justify-content-between align-items-center p-3">
          <div className="navbar-brand">
            <Link to="/">
              <img src={rock} alt="Logo" className="logo-img me-3" />
            </Link>
          </div>

                <div className="d-flex align-items-center">
                    <span className="navbar-text me-4 d-none d-md-block user-info-navbar text-white">
                        <i className="fas fa-user-circle me-2"></i>
                         <strong>{userName}</strong>
                    </span>

                    <button type="button" onClick={handleLogout} className="btn-ktm">
                        <i className="fa-solid fa-power-off me-2"></i> Cerrar sesión
                    </button>
                </div>
            </header>

            <div className="wrapper">


                {/* CONTENIDO DINÁMICO */}
                <div id="content">
                    <div id="workspace">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Panel;

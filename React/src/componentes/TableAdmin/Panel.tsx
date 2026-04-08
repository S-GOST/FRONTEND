import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { logout } from '../../services/adminService';
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
                logout();
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
                {/* SIDEBAR */}
                <nav id="sidebar">
                    <h5 className="text-center">
                        {userRole === 'admin' ? 'MENÚ DE GESTIÓN' : 'PANEL TÉCNICO'}
                    </h5>
                    <div className="menu-links-container">
                        {userRole === 'admin' ? (
                            <>
                                <NavLink to="/admin/dashboard" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                    <i className="fa-solid fa-gauge"></i> Dashboard
                                </NavLink>
                                <NavLink to="/admin/administradores" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                    <i className="fa-solid fa-user-shield"></i> Administradores
                                </NavLink>
                                <NavLink to="/admin/tecnicos" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                    <i className="fa-solid fa-user-gear"></i> Técnicos
                                </NavLink>
                                <NavLink to="/admin/clientes" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                    <i className="fa-solid fa-users"></i> Clientes
                                </NavLink>
                                <NavLink to="/admin/motos" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                    <i className="fa-solid fa-motorcycle"></i> Motos
                                </NavLink>
                                <NavLink to="/admin/servicios" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                    <i className="fa-solid fa-screwdriver-wrench"></i> Servicios
                                </NavLink>
                                <NavLink to="/admin/productos" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                    <i className="fa-solid fa-box"></i> Productos
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink to="/tecnico/dashboard" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                    <i className="fa-solid fa-gauge"></i> Dashboard
                                </NavLink>
                                <NavLink to="/tecnico/productos" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                    <i className="fa-solid fa-box"></i> Productos
                                </NavLink>
                                <NavLink to="/tecnico/servicios" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                    <i className="fa-solid fa-screwdriver-wrench"></i> Servicios
                                </NavLink>
                            </>
                        )}
                    </div>
                </nav>

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

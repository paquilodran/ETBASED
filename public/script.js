// Conectar a Socket.io
const socket = io();

// Elementos del DOM - Oracle
const clientesBody = document.getElementById('clientesBody');
const clientesCount = document.getElementById('clientesCount');

// Elementos del DOM - MongoDB
const usuariosBody = document.getElementById('usuariosBody');
const usuariosCount = document.getElementById('usuariosCount');

// Elementos comunes
const status = document.getElementById('status');
const statusText = document.getElementById('statusText');

// Estado de conexión
socket.on('connect', () => {
    status.classList.add('connected');
    status.classList.remove('disconnected');
    statusText.textContent = 'Conectado en tiempo real';
    cargarClientes();
    cargarUsuarios();
});

socket.on('disconnect', () => {
    status.classList.add('disconnected');
    status.classList.remove('connected');
    statusText.textContent = 'Desconectado';
});

// ========== CLIENTES (ORACLE) ==========

async function cargarClientes() {
    try {
        const response = await fetch('/api/clientes');
        const clientes = await response.json();

        clientesBody.innerHTML = '';

        if (clientes.length === 0) {
            clientesBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#999; padding:30px;">No hay clientes en Oracle</td></tr>';
        } else {
            clientes.forEach(cliente => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${cliente.ID}</td>
                    <td>${cliente.NOMBRE || 'Sin nombre'}</td>
                    <td>${cliente.EMAIL || 'Sin email'}</td>
                    <td>${cliente.TELEFONO || 'N/A'}</td>
                    <td>${cliente.CIUDAD || 'N/A'}</td>
                    <td><span class="badge ${cliente.ESTADO}">${cliente.ESTADO || 'N/A'}</span></td>
                    <td>
                        <button class="btn-delete" onclick="eliminarCliente('${cliente.ID}')">
                            Eliminar
                        </button>
                    </td>
                `;
                clientesBody.appendChild(tr);
            });
        }

        // Actualizar contador
        const countResponse = await fetch('/api/clientes/count');
        const countData = await countResponse.json();
        clientesCount.textContent = countData.total;
    } catch (err) {
        console.error('Error cargando clientes:', err);
        clientesBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#e74c3c; padding:30px;">Error al cargar clientes de Oracle</td></tr>';
        clientesCount.textContent = '?';
    }
}

async function eliminarCliente(id) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
        const response = await fetch(`/api/clientes/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!data.success) {
            alert('Error al eliminar cliente');
        }
    } catch (err) {
        console.error('Error eliminando cliente:', err);
        alert('Error al eliminar cliente');
    }
}

// ========== USUARIOS (MONGODB) ==========

async function cargarUsuarios() {
    try {
        const response = await fetch('/api/usuarios');
        const usuarios = await response.json();

        usuariosBody.innerHTML = '';

        if (usuarios.length === 0) {
            usuariosBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999; padding:30px;">No hay usuarios en MongoDB</td></tr>';
        } else {
            usuarios.forEach(usuario => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${usuario._id}</td>
                    <td>${usuario.nombre || usuario.customerId || 'Sin nombre'}</td>
                    <td>${usuario.email || usuario.action || 'Sin email'}</td>
                    <td>
                        <button class="btn-delete" onclick="eliminarUsuario('${usuario._id}')">
                            Eliminar
                        </button>
                    </td>
                `;
                usuariosBody.appendChild(tr);
            });
        }

        // Actualizar contador
        const countResponse = await fetch('/api/usuarios/count');
        const countData = await countResponse.json();
        usuariosCount.textContent = countData.total;
    } catch (err) {
        console.error('Error cargando usuarios:', err);
        usuariosBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#e74c3c; padding:30px;">Error al cargar usuarios de MongoDB</td></tr>';
        usuariosCount.textContent = '?';
    }
}

async function eliminarUsuario(id) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!data.success) {
            alert('Error al eliminar usuario');
        }
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        alert('Error al eliminar usuario');
    }
}

// ========== WEBSOCKETS ==========

socket.on('clienteEliminado', () => {
    console.log('Cliente eliminado - actualizando lista...');
    cargarClientes();
});

socket.on('usuarioEliminado', () => {
    console.log('Usuario eliminado - actualizando lista...');
    cargarUsuarios();
});

// ========== TOGGLE TABLES ==========

function toggleTable(tipo) {
    const tableWrapper = document.getElementById(`tableWrapper${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    const toggleIcon = document.getElementById(`toggleIcon${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);

    if (!tableWrapper || !toggleIcon) {
        console.error('No se encontraron los elementos');
        return;
    }

    tableWrapper.classList.toggle('collapsed');

    if (tableWrapper.classList.contains('collapsed')) {
        toggleIcon.textContent = '▶';
    } else {
        toggleIcon.textContent = '▼';
    }
}
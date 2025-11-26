// app.js - Solo para la página principal (dashboard)
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (data.user) {
            // Usuario autenticado - cargar aplicación principal
            loadApp(data.user);
        } else {
            // No autenticado - redirigir a login
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error:', error);
        window.location.href = '/login';
    }
});

// Cargar aplicación principal
function loadApp(user) {
    const app = document.getElementById('app');
    
    if (user.tipo === 'administrador') {
        app.innerHTML = `
            <div class="dashboard">
                <header>
                    <h1>🏪 POS Tienda - Administrador</h1>
                    <div class="user-info">
                        Hola, ${user.username} 
                        <button onclick="logout()">Cerrar Sesión</button>
                    </div>
                </header>
                
                <nav class="admin-menu">
                    <button onclick="showSection('categorias')">📁 Categorías</button>
                    <button onclick="showSection('productos')">📦 Productos</button>
                    <button onclick="showSection('usuarios')">👥 Usuarios</button>
                    <button onclick="showSection('ventas')">🧾 Ventas</button>
                    <button onclick="showSection('cobro')">💵 Cobro</button>
                </nav>
                
                <main id="main-content">
                    <div class="welcome">
                        <h2>Bienvenido al Sistema POS</h2>
                        <p>Selecciona una opción del menú para comenzar</p>
                    </div>
                </main>
            </div>
        `;
    } else {
        // Vista para cajero - solo cobro (carga automáticamente el módulo de cobro)
        app.innerHTML = `
            <div class="dashboard-cajero">
                <header class="header-cajero">
                    <div class="header-left">
                        <h1>🏪 POS Tienda - Cajero</h1>
                        <div class="user-info-cajero">
                            Hola, <strong>${user.username}</strong>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn-logout-cajero" onclick="logout()">🚪 Cerrar Sesión</button>
                    </div>
                </header>
                
                <div id="cajero-content">
                    <!-- Aquí se cargará automáticamente el módulo de cobro -->
                </div>
            </div>
        `;
        
        // Cargar automáticamente el módulo de cobro para cajeros
        setTimeout(() => {
            loadCobroCajero();
        }, 100);
    }
}

// Función para cerrar sesión
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Función para mostrar secciones (solo admin)
function showSection(section) {
    const mainContent = document.getElementById('main-content');
    
    switch(section) {
        case 'categorias':
            loadCategorias();
            break;
        case 'productos':
            loadProductos();
            break;
        case 'usuarios':  
            loadUsuarios();
            break;
        case 'ventas':
            loadVentas();
            break;
        case 'cobro':
            loadCobro();
            break;
        default:
            mainContent.innerHTML = `<h2>Selecciona una opción del menú</h2>`;
    }
}

// 📁 FUNCIONES PARA CATEGORÍAS
async function loadCategorias() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="section-header">
            <h2>📁 Gestión de Categorías</h2>
            <button class="btn-primary" onclick="showFormCategoria()">+ Nueva Categoría</button>
        </div>
        
        <div class="categorias-container">
            <div id="form-categoria" class="form-container" style="display: none;">
                <h3 id="form-title">Nueva Categoría</h3>
                <form id="categoria-form">
                    <input type="hidden" id="categoria-id">
                    <input type="text" id="categoria-nombre" placeholder="Nombre de la categoría" required>
                    <div class="form-buttons">
                        <button type="submit" id="btn-submit">Guardar</button>
                        <button type="button" onclick="hideFormCategoria()">Cancelar</button>
                    </div>
                </form>
            </div>
            
            <div id="lista-categorias" class="lista-container">
                <h3>Lista de Categorías</h3>
                <div id="categorias-list" class="grid-list">
                    <!-- Las categorías se cargarán aquí -->
                </div>
            </div>
        </div>
        
        <div id="categorias-message"></div>
    `;

    // Configurar el formulario
    document.getElementById('categoria-form').addEventListener('submit', guardarCategoria);
    
    // Cargar categorías existentes
    await cargarListaCategorias();
}

async function cargarListaCategorias() {
    try {
        const response = await fetch('/api/categorias');
        const categorias = await response.json();
        
        const lista = document.getElementById('categorias-list');
        lista.innerHTML = '';
        
        if (categorias.length === 0) {
            lista.innerHTML = '<p class="no-data">No hay categorías registradas</p>';
            return;
        }
        
        categorias.forEach(categoria => {
            const categoriaDiv = document.createElement('div');
            categoriaDiv.className = 'card';
            categoriaDiv.innerHTML = `
                <div class="card-content">
                    <h4>${categoria.nombre}</h4>
                    <div class="card-actions">
                        <button class="btn-edit" onclick="editarCategoria(${categoria.id}, '${categoria.nombre}')">✏️ Editar</button>
                        <button class="btn-delete" onclick="eliminarCategoria(${categoria.id})">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
            lista.appendChild(categoriaDiv);
        });
        
    } catch (error) {
        mostrarMensaje('Error cargando categorías', 'error');
    }
}

function showFormCategoria() {
    document.getElementById('form-categoria').style.display = 'block';
    document.getElementById('form-title').textContent = 'Nueva Categoría';
    document.getElementById('categoria-id').value = '';
    document.getElementById('categoria-nombre').value = '';
    document.getElementById('btn-submit').textContent = 'Guardar';
}

function hideFormCategoria() {
    document.getElementById('form-categoria').style.display = 'none';
}

function editarCategoria(id, nombre) {
    document.getElementById('form-categoria').style.display = 'block';
    document.getElementById('form-title').textContent = 'Editar Categoría';
    document.getElementById('categoria-id').value = id;
    document.getElementById('categoria-nombre').value = nombre;
    document.getElementById('btn-submit').textContent = 'Actualizar';
}

async function guardarCategoria(e) {
    e.preventDefault();
    
    const id = document.getElementById('categoria-id').value;
    const nombre = document.getElementById('categoria-nombre').value;
    
    const url = id ? `/api/categorias/${id}` : '/api/categorias';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje(data.mensaje, 'success');
            hideFormCategoria();
            await cargarListaCategorias();
        } else {
            mostrarMensaje(data.error, 'error');
        }
    } catch (error) {
        mostrarMensaje('Error de conexión', 'error');
    }
}

async function eliminarCategoria(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/categorias/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje(data.mensaje, 'success');
            await cargarListaCategorias();
        } else {
            mostrarMensaje(data.error, 'error');
        }
    } catch (error) {
        mostrarMensaje('Error de conexión', 'error');
    }
}

// Función utilitaria para mostrar mensajes
function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('categorias-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `message ${tipo}`;
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 3000);
}

// 📦 FUNCIONES PARA PRODUCTOS
async function loadProductos() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="section-header">
            <h2>📦 Gestión de Productos</h2>
            <button class="btn-primary" onclick="showFormProducto()">+ Nuevo Producto</button>
        </div>
        
        <div class="filtros-container">
            <input type="text" id="buscar-producto" placeholder="🔍 Buscar por nombre o código..." onkeyup="filtrarProductos()">
            <select id="filtro-categoria" onchange="filtrarProductos()">
                <option value="">Todas las categorías</option>
            </select>
            <select id="filtro-inventario" onchange="filtrarProductos()">
                <option value="">Todos los productos</option>
                <option value="con">Con control de inventario</option>
                <option value="sin">Sin control de inventario</option>
            </select>
        </div>
        
        <div class="productos-container">
            <div id="form-producto" class="form-container" style="display: none;">
                <h3 id="form-title-producto">Nuevo Producto</h3>
                <form id="producto-form">
                    <input type="hidden" id="producto-id">
                    <input type="text" id="producto-codigo" placeholder="Código de barras (opcional)">
                    <input type="text" id="producto-nombre" placeholder="Nombre del producto *" required>
                    <input type="number" id="producto-precio" placeholder="Precio *" step="0.01" min="0" required>
                    <select id="producto-categoria" required>
                        <option value="">Seleccionar categoría *</option>
                    </select>
                    
                    <!-- NUEVO: Control de inventario -->
                    <div class="inventario-toggle">
                        <label>
                            <input type="checkbox" id="producto-control-inventario" checked onchange="toggleControlInventario()">
                            Controlar inventario de este producto
                        </label>
                        <small>Desactiva esto para productos que se preparan al momento (comida, etc.)</small>
                    </div>
                    
                    <div id="stock-container">
                        <input type="number" id="producto-stock" placeholder="Stock inicial *" min="0" value="0" required>
                    </div>
                    
                    <div class="form-notes">
                        <small>* Campos obligatorios</small>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" id="btn-submit-producto">Guardar</button>
                        <button type="button" onclick="hideFormProducto()">Cancelar</button>
                    </div>
                </form>
            </div>
            
            <div id="lista-productos" class="lista-container">
                <h3>Lista de Productos <small>(${window.todosProductos ? window.todosProductos.length : 0} productos)</small></h3>
                <div id="productos-list" class="grid-list">
                    <!-- Los productos se cargarán aquí -->
                </div>
            </div>
        </div>
        
        <div id="productos-message"></div>
    `;

    // Configurar el formulario
    document.getElementById('producto-form').addEventListener('submit', guardarProducto);
    
    // Cargar categorías para el select
    await cargarCategoriasParaSelect();
    
    // Cargar productos existentes
    await cargarListaProductos();
}

async function cargarCategoriasParaSelect() {
    try {
        const response = await fetch('/api/categorias');
        const categorias = await response.json();
        
        const selectForm = document.getElementById('producto-categoria');
        const selectFiltro = document.getElementById('filtro-categoria');
        
        // Limpiar selects
        selectForm.innerHTML = '<option value="">Seleccionar categoría</option>';
        selectFiltro.innerHTML = '<option value="">Todas las categorías</option>';
        
        categorias.forEach(categoria => {
            const optionForm = document.createElement('option');
            optionForm.value = categoria.id;
            optionForm.textContent = categoria.nombre;
            selectForm.appendChild(optionForm);
            
            const optionFiltro = document.createElement('option');
            optionFiltro.value = categoria.id;
            optionFiltro.textContent = categoria.nombre;
            selectFiltro.appendChild(optionFiltro);
        });
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

async function cargarListaProductos() {
    try {
        const response = await fetch('/api/productos');
        const productos = await response.json();
        
        // Guardar productos globalmente para filtrado
        window.todosProductos = productos;
        
        mostrarProductosEnLista(productos);
        
    } catch (error) {
        mostrarMensajeProductos('Error cargando productos', 'error');
    }
}

function mostrarProductosEnLista(productos) {
    const lista = document.getElementById('productos-list');
    lista.innerHTML = '';
    
    // Actualizar contador
    const titulo = document.querySelector('#lista-productos h3');
    if (titulo) {
        titulo.innerHTML = `Lista de Productos <small>(${productos.length} productos)</small>`;
    }
    
    if (productos.length === 0) {
        lista.innerHTML = '<p class="no-data">No se encontraron productos</p>';
        return;
    }
    
    productos.forEach(producto => {
        const productoDiv = document.createElement('div');
        productoDiv.className = 'card';
        
        const inventarioInfo = producto.control_inventario ? 
            `<p><strong>Stock:</strong> ${producto.stock} unidades</p>` :
            `<p><strong>Inventario:</strong> <span class="sin-inventario">No se controla</span></p>`;
        
        productoDiv.innerHTML = `
            <div class="card-content">
                <h4>${producto.nombre}</h4>
                ${producto.codigo_barras ? `<p><strong>Código:</strong> ${producto.codigo_barras}</p>` : ''}
                <p><strong>Precio:</strong> $${parseFloat(producto.precio).toFixed(2)}</p>
                ${inventarioInfo}
                <p><strong>Categoría:</strong> ${producto.categoria_nombre || 'Sin categoría'}</p>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editarProducto(${producto.id}, '${(producto.codigo_barras || '').replace(/'/g, "\\'")}', '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio}, ${producto.categoria_id || 'null'}, ${producto.stock}, ${producto.control_inventario})">✏️ Editar</button>
                    <button class="btn-delete" onclick="eliminarProducto(${producto.id})">🗑️ Eliminar</button>
                </div>
            </div>
        `;
        lista.appendChild(productoDiv);
    });
}

function filtrarProductos() {
    const textoBusqueda = document.getElementById('buscar-producto').value.toLowerCase();
    const categoriaId = document.getElementById('filtro-categoria').value;
    const filtroInventario = document.getElementById('filtro-inventario').value;
    
    const productosFiltrados = window.todosProductos.filter(producto => {
        const coincideTexto = producto.nombre.toLowerCase().includes(textoBusqueda) || 
                             (producto.codigo_barras && producto.codigo_barras.toLowerCase().includes(textoBusqueda));
        
        const coincideCategoria = !categoriaId || producto.categoria_id == categoriaId;
        
        const coincideInventario = !filtroInventario || 
                                 (filtroInventario === 'con' && producto.control_inventario) ||
                                 (filtroInventario === 'sin' && !producto.control_inventario);
        
        return coincideTexto && coincideCategoria && coincideInventario;
    });
    
    mostrarProductosEnLista(productosFiltrados);
}

function showFormProducto() {
    document.getElementById('form-producto').style.display = 'block';
    document.getElementById('form-title-producto').textContent = 'Nuevo Producto';
    document.getElementById('producto-id').value = '';
    document.getElementById('producto-codigo').value = '';
    document.getElementById('producto-nombre').value = '';
    document.getElementById('producto-precio').value = '';
    document.getElementById('producto-categoria').value = '';
    document.getElementById('producto-control-inventario').checked = true;
    document.getElementById('producto-stock').value = '0';
    document.getElementById('btn-submit-producto').textContent = 'Guardar';
    
    // Mostrar campo stock por defecto
    document.getElementById('stock-container').style.display = 'block';
}

function hideFormProducto() {
    document.getElementById('form-producto').style.display = 'none';
}

function editarProducto(id, codigo, nombre, precio, categoriaId, stock) {
    document.getElementById('form-producto').style.display = 'block';
    document.getElementById('form-title-producto').textContent = 'Editar Producto';
    document.getElementById('producto-id').value = id;
    document.getElementById('producto-codigo').value = codigo;
    document.getElementById('producto-nombre').value = nombre;
    document.getElementById('producto-precio').value = precio;
    document.getElementById('producto-categoria').value = categoriaId || '';
    document.getElementById('producto-stock').value = stock;
    document.getElementById('btn-submit-producto').textContent = 'Actualizar';
}

async function guardarProducto(e) {
    e.preventDefault();
    
    const id = document.getElementById('producto-id').value;
    const codigo_barras = document.getElementById('producto-codigo').value.trim();
    const nombre = document.getElementById('producto-nombre').value.trim();
    const precio = parseFloat(document.getElementById('producto-precio').value);
    const categoria_id = document.getElementById('producto-categoria').value;
    const control_inventario = document.getElementById('producto-control-inventario').checked;
    const stock = control_inventario ? parseInt(document.getElementById('producto-stock').value) : 0;
    
    // Validaciones
    if (!nombre || isNaN(precio) || precio < 0) {
        mostrarMensajeProductos('Nombre y precio válido son requeridos', 'error');
        return;
    }
    
    if (!categoria_id) {
        mostrarMensajeProductos('Debes seleccionar una categoría', 'error');
        return;
    }
    
    if (control_inventario && (isNaN(stock) || stock < 0)) {
        mostrarMensajeProductos('Stock debe ser un número válido', 'error');
        return;
    }
    
    const productoData = {
        codigo_barras: codigo_barras || null,
        nombre,
        precio,
        categoria_id: categoria_id,
        stock: stock,
        control_inventario: control_inventario ? 1 : 0
    };
    
    const url = id ? `/api/productos/${id}` : '/api/productos';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productoData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensajeProductos(data.mensaje, 'success');
            hideFormProducto();
            await cargarListaProductos();
        } else {
            mostrarMensajeProductos(data.error, 'error');
        }
    } catch (error) {
        mostrarMensajeProductos('Error de conexión', 'error');
    }
}

async function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/productos/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensajeProductos(data.mensaje, 'success');
            await cargarListaProductos();
        } else {
            mostrarMensajeProductos(data.error, 'error');
        }
    } catch (error) {
        mostrarMensajeProductos('Error de conexión', 'error');
    }
}

function mostrarMensajeProductos(mensaje, tipo) {
    const messageDiv = document.getElementById('productos-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `message ${tipo}`;
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 3000);
}

// Función para mostrar/ocultar campo de stock
function toggleControlInventario() {
    const controlInventario = document.getElementById('producto-control-inventario').checked;
    const stockContainer = document.getElementById('stock-container');
    const stockInput = document.getElementById('producto-stock');
    
    if (controlInventario) {
        stockContainer.style.display = 'block';
        stockInput.required = true;
    } else {
        stockContainer.style.display = 'none';
        stockInput.required = false;
        stockInput.value = '0';
    }
}

// 💵 FUNCIONES PARA COBRO - VERSIÓN CORREGIDA
async function loadCobro() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="cobro-container">
            <!-- Panel izquierdo: Categorías y Búsqueda -->
            <div class="cobro-sidebar">
                <div class="busqueda-container">
                    <h3>🔍 Buscar Producto</h3>
                    <input type="text" id="buscar-cobro" placeholder="Código de barras o nombre..." 
                           onkeydown="manejarEnterBusqueda(event)">
                    <button onclick="buscarProductoCobro()">Buscar</button>
                </div>
                
                <div class="categorias-cobro">
                    <h3>📁 Categorías</h3>
                    <div id="lista-categorias-cobro" class="categorias-lista">
                        <!-- Las categorías se cargarán aquí -->
                    </div>
                </div>
                
                <div class="productos-categoria" id="productos-categoria" style="display: none;">
                    <h3 id="titulo-categoria"></h3>
                    <div id="lista-productos-categoria" class="productos-lista">
                        <!-- Los productos de la categoría se cargarán aquí -->
                    </div>
                    <button class="btn-volver" onclick="volverACategorias()">← Volver a categorías</button>
                </div>
            </div>
            
            <!-- Panel derecho: Carrito de compras -->
            <div class="carrito-container">
                <div class="carrito-header">
                    <h3>🛒 Carrito de Compra</h3>
                    <div class="carrito-info">
                        <div class="total-carrito">Total: $<span id="total-carrito">0.00</span></div>
                    </div>
                </div>
                
                <div class="carrito-lista" id="carrito-lista">
                    <!-- Los productos del carrito se mostrarán aquí -->
                    <div class="carrito-vacio" id="carrito-vacio">
                        <p>El carrito está vacío</p>
                        <small>Busca productos o selecciona una categoría</small>
                    </div>
                </div>
                
                <div class="carrito-actions">
                    <button class="btn-cargar" onclick="mostrarCarritosGuardados()">📂 Cargar Cuenta</button>
                    <button class="btn-cancelar" onclick="cancelarCuenta()">❌ Cancelar</button>
                    <button class="btn-guardar" onclick="guardarCuenta()">💾 Guardar</button>
                    <button class="btn-finalizar" onclick="finalizarCuenta()">✅ Finalizar</button>
                </div>
            </div>
        </div>
        
        <div id="cobro-message"></div>
    `;

    // Inicializar carrito VACÍO
    window.carritoCobro = [];
    
    // Cargar categorías para el cobro
    await cargarCategoriasCobro();
    
    // Actualizar carrito (se mostrará vacío)
    actualizarCarritoCobro();
}

// Cargar categorías para el módulo de cobro
async function cargarCategoriasCobro() {
    try {
        const response = await fetch('/api/categorias');
        const categorias = await response.json();
        
        const lista = document.getElementById('lista-categorias-cobro');
        lista.innerHTML = '';
        
        categorias.forEach(categoria => {
            const categoriaDiv = document.createElement('div');
            categoriaDiv.className = 'categoria-item';
            categoriaDiv.innerHTML = `
                <div class="categoria-nombre" onclick="cargarProductosCategoria(${categoria.id}, '${categoria.nombre.replace(/'/g, "\\'")}')">
                    ${categoria.nombre}
                </div>
            `;
            lista.appendChild(categoriaDiv);
        });
        
    } catch (error) {
        mostrarMensajeCobro('Error cargando categorías', 'error');
    }
}

// Cargar productos de una categoría específica
async function cargarProductosCategoria(categoriaId, categoriaNombre) {
    try {
        const response = await fetch('/api/productos');
        const productos = await response.json();
        
        // Usar == para comparación flexible
        const productosFiltrados = productos.filter(p => p.categoria_id == categoriaId);
        
        document.getElementById('lista-categorias-cobro').style.display = 'none';
        document.getElementById('productos-categoria').style.display = 'block';
        document.getElementById('titulo-categoria').textContent = categoriaNombre;
        
        const lista = document.getElementById('lista-productos-categoria');
        lista.innerHTML = '';
        
        if (productosFiltrados.length === 0) {
            lista.innerHTML = '<p class="no-data">No hay productos en esta categoría</p>';
            return;
        }
        
        productosFiltrados.forEach(producto => {
            const productoDiv = document.createElement('div');
            productoDiv.className = 'producto-item-cobro';
            productoDiv.innerHTML = `
                <div class="producto-info" onclick="agregarAlCarritoCobro(${producto.id})">
                    <strong>${producto.nombre}</strong>
                    <div>$${parseFloat(producto.precio).toFixed(2)}</div>
                </div>
            `;
            lista.appendChild(productoDiv);
        });
        
    } catch (error) {
        mostrarMensajeCobro('Error cargando productos', 'error');
    }
}

// Volver a la lista de categorías
function volverACategorias() {
    document.getElementById('lista-categorias-cobro').style.display = 'block';
    document.getElementById('productos-categoria').style.display = 'none';
}

// Buscar producto por código o nombre - VERSIÓN CORREGIDA
async function buscarProductoCobro() {
    const busqueda = document.getElementById('buscar-cobro').value.trim();
    
    if (!busqueda) {
        mostrarMensajeCobro('Ingresa un código o nombre para buscar', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/productos');
        const productos = await response.json();
        
        // Búsqueda más flexible
        const productoEncontrado = productos.find(p => 
            (p.codigo_barras && p.codigo_barras.toString() === busqueda) || 
            p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
        
        if (productoEncontrado) {
            await agregarAlCarritoCobro(productoEncontrado.id);
            document.getElementById('buscar-cobro').value = '';
        } else {
            mostrarMensajeCobro('Producto no encontrado', 'error');
        }
        
    } catch (error) {
        console.error('Error buscando producto:', error);
        mostrarMensajeCobro('Error buscando producto', 'error');
    }
}

// Manejar tecla Enter en búsqueda
function manejarEnterBusqueda(event) {
    if (event.key === 'Enter') {
        buscarProductoCobro();
    }
}

// Agregar producto al carrito - VERSIÓN COMPLETAMENTE CORREGIDA
async function agregarAlCarritoCobro(productoId) {
    try {
        const response = await fetch('/api/productos');
        const productos = await response.json();
        
        // Usar == para comparación flexible
        const producto = productos.find(p => p.id == productoId);
        
        if (!producto) {
            mostrarMensajeCobro('Producto no encontrado', 'error');
            return;
        }
        
        // Asegurarnos de que el carrito existe
        if (!window.carritoCobro) {
            window.carritoCobro = [];
        }
        
        // Verificar stock si controla inventario
        if (producto.control_inventario && producto.stock <= 0) {
            mostrarMensajeCobro('Producto sin stock', 'error');
            return;
        }
        
        // Buscar producto en carrito (usar ==)
        const itemExistente = window.carritoCobro.find(item => item.id == productoId);
        
        if (itemExistente) {
            // Si controla inventario, verificar que no exceda el stock
            if (producto.control_inventario && itemExistente.cantidad >= producto.stock) {
                mostrarMensajeCobro('No hay suficiente stock', 'error');
                return;
            }
            itemExistente.cantidad++;
        } else {
            window.carritoCobro.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: parseFloat(producto.precio),
                cantidad: 1,
                control_inventario: producto.control_inventario
            });
        }
        
        actualizarCarritoCobro();
        mostrarMensajeCobro(`✅ ${producto.nombre} agregado`, 'success');
        
    } catch (error) {
        console.error('Error agregando producto:', error);
        mostrarMensajeCobro('Error agregando producto: ' + error.message, 'error');
    }
}

// Actualizar visualización del carrito - VERSIÓN CORREGIDA
function actualizarCarritoCobro() {
    const lista = document.getElementById('carrito-lista');
    const vacio = document.getElementById('carrito-vacio');
    const totalElement = document.getElementById('total-carrito');
    
    // Asegurarnos de que el carrito existe
    if (!window.carritoCobro) {
        window.carritoCobro = [];
    }
    
    if (window.carritoCobro.length === 0) {
        lista.innerHTML = '';
        if (vacio) {
            lista.appendChild(vacio);
            vacio.style.display = 'block';
        }
        totalElement.textContent = '0.00';
        return;
    }
    
    if (vacio) {
        vacio.style.display = 'none';
    }
    
    lista.innerHTML = '';
    
    let total = 0;
    
    window.carritoCobro.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'carrito-item';
        itemDiv.innerHTML = `
            <div class="item-info">
                <div class="item-nombre">${item.nombre}</div>
                <div class="item-detalles">
                    <span class="item-cantidad">${item.cantidad} x $${parseFloat(item.precio).toFixed(2)}</span>
                    <span class="item-subtotal">$${subtotal.toFixed(2)}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-quitar" onclick="quitarDelCarritoCobro(${index})">🗑️</button>
            </div>
        `;
        lista.appendChild(itemDiv);
    });
    
    totalElement.textContent = total.toFixed(2);
}

// Quitar producto del carrito - VERSIÓN CORREGIDA
function quitarDelCarritoCobro(index) {
    if (!window.carritoCobro || !window.carritoCobro[index]) {
        console.error('Índice inválido para quitar del carrito');
        return;
    }
    
    const productoNombre = window.carritoCobro[index].nombre;
    window.carritoCobro.splice(index, 1);
    actualizarCarritoCobro();
    mostrarMensajeCobro(`🗑️ ${productoNombre} eliminado`, 'success');
}

// Cancelar cuenta (vaciar carrito) - VERSIÓN CORREGIDA
function cancelarCuenta() {
    if (!window.carritoCobro || window.carritoCobro.length === 0) {
        mostrarMensajeCobro('El carrito ya está vacío', 'error');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres cancelar esta cuenta? Se perderán todos los productos.')) {
        window.carritoCobro = [];
        actualizarCarritoCobro();
        mostrarMensajeCobro('Cuenta cancelada', 'success');
    }
}

// Guardar cuenta (para continuar después)
function guardarCuenta() {
    if (!window.carritoCobro || window.carritoCobro.length === 0) {
        mostrarMensajeCobro('El carrito está vacío', 'error');
        return;
    }
    
    mostrarMensajeCobro('Función de guardar cuenta en desarrollo', 'info');
}

// Finalizar cuenta - VERSIÓN CON INTERFAZ MEJORADA
async function finalizarCuenta() {
    if (!window.carritoCobro || window.carritoCobro.length === 0) {
        mostrarMensajeCobro('El carrito está vacío', 'error');
        return;
    }
    
    const total = parseFloat(document.getElementById('total-carrito').textContent);
    
    // Crear interfaz para ingresar pago
    const modalPago = `
        <div class="modal-pago-overlay" id="modalPagoOverlay">
            <div class="modal-pago">
                <h3>💵 Procesar Pago</h3>
                <div class="pago-info">
                    <p><strong>Total a pagar:</strong> $${total.toFixed(2)}</p>
                </div>
                <div class="pago-input">
                    <label>Monto recibido:</label>
                    <input type="number" id="montoRecibido" step="0.01" min="${total}" value="${total}" autofocus>
                </div>
                <div class="pago-resumen" id="pagoResumen">
                    <p><strong>Cambio:</strong> $0.00</p>
                </div>
                <div class="pago-botones">
                    <button onclick="cerrarModalPago()">Cancelar</button>
                    <button onclick="confirmarPago(${total})" class="btn-confirmar">Confirmar Venta</button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar el modal al body
    document.body.insertAdjacentHTML('beforeend', modalPago);
    
    // Configurar evento para calcular cambio en tiempo real
    document.getElementById('montoRecibido').addEventListener('input', function() {
        calcularCambio(total);
    });
    
    // Enfocar el input
    document.getElementById('montoRecibido').focus();
}

// Calcular cambio en tiempo real
function calcularCambio(total) {
    const montoRecibido = parseFloat(document.getElementById('montoRecibido').value) || 0;
    const cambio = montoRecibido - total;
    const resumen = document.getElementById('pagoResumen');
    
    if (cambio >= 0) {
        resumen.innerHTML = `<p><strong>Cambio:</strong> $${cambio.toFixed(2)}</p>`;
        resumen.style.color = '#27ae60';
    } else {
        resumen.innerHTML = `<p style="color: #e74c3c;"><strong>Faltan:</strong> $${Math.abs(cambio).toFixed(2)}</p>`;
        resumen.style.color = '#e74c3c';
    }
}

// Cerrar modal de pago
function cerrarModalPago() {
    const modal = document.getElementById('modalPagoOverlay');
    if (modal) {
        modal.remove();
    }
}

// Confirmar pago y procesar venta
async function confirmarPago(total) {
    const montoRecibido = parseFloat(document.getElementById('montoRecibido').value);
    const cambio = montoRecibido - total;
    
    if (isNaN(montoRecibido) || montoRecibido <= 0) {
        alert('Monto inválido');
        return;
    }
    
    if (montoRecibido < total) {
        alert(`El pago ($${montoRecibido.toFixed(2)}) es menor al total ($${total.toFixed(2)})`);
        return;
    }
    
    // Cerrar modal
    cerrarModalPago();
    
    // Proceder con el registro de la venta
    try {
        const response = await fetch('/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                total: total,
                productos: window.carritoCobro,
                pago_recibido: montoRecibido,
                cambio: cambio
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Mostrar mensaje con el cambio
            mostrarMensajeCobro(`✅ Venta registrada - Cambio: $${cambio.toFixed(2)}`, 'success');
            
            // Alertar sobre el cambio a entregar
            setTimeout(() => {
                alert(`💵 ENTREGAR AL CLIENTE:\nCambio: $${cambio.toFixed(2)}`);
            }, 500);
            
            // Limpiar carrito
            window.carritoCobro = [];
            actualizarCarritoCobro();
        } else {
            mostrarMensajeCobro('Error: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error finalizando cuenta:', error);
        mostrarMensajeCobro('Error de conexión: ' + error.message, 'error');
    }
}

// Mostrar carritos guardados
function mostrarCarritosGuardados() {
    mostrarMensajeCobro('Función de carritos guardados en desarrollo', 'info');
}

// Mostrar mensajes en módulo de cobro
function mostrarMensajeCobro(mensaje, tipo) {
    const messageDiv = document.getElementById('cobro-message');
    if (messageDiv) {
        messageDiv.textContent = mensaje;
        messageDiv.className = `message ${tipo}`;
        
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 3000);
    }
}

// 💵 FUNCIÓN ESPECÍFICA PARA CAJEROS - carga el módulo de cobro directamente
async function loadCobroCajero() {
    const cajeroContent = document.getElementById('cajero-content');
    
    // Verificar que el elemento existe
    if (!cajeroContent) {
        console.error('No se encontró el contenedor para cajeros');
        return;
    }
    
    cajeroContent.innerHTML = `
        <div class="cobro-container">
            <!-- Panel izquierdo: Categorías y Búsqueda -->
            <div class="cobro-sidebar">
                <div class="busqueda-container">
                    <h3>🔍 Buscar Producto</h3>
                    <input type="text" id="buscar-cobro" placeholder="Código de barras o nombre..." 
                           onkeydown="manejarEnterBusqueda(event)">
                    <button onclick="buscarProductoCobro()">Buscar</button>
                </div>
                
                <div class="categorias-cobro">
                    <h3>📁 Categorías</h3>
                    <div id="lista-categorias-cobro" class="categorias-lista">
                        <!-- Las categorías se cargarán aquí -->
                    </div>
                </div>
                
                <div class="productos-categoria" id="productos-categoria" style="display: none;">
                    <h3 id="titulo-categoria"></h3>
                    <div id="lista-productos-categoria" class="productos-lista">
                        <!-- Los productos de la categoría se cargarán aquí -->
                    </div>
                    <button class="btn-volver" onclick="volverACategorias()">← Volver a categorías</button>
                </div>
            </div>
            
            <!-- Panel derecho: Carrito de compras -->
            <div class="carrito-container">
                <div class="carrito-header">
                    <h3>🛒 Carrito de Compra</h3>
                    <div class="carrito-info">
                        <div class="total-carrito">Total: $<span id="total-carrito">0.00</span></div>
                    </div>
                </div>
                
                <div class="carrito-lista" id="carrito-lista">
                    <!-- Los productos del carrito se mostrarán aquí -->
                    <div class="carrito-vacio" id="carrito-vacio">
                        <p>El carrito está vacío</p>
                        <small>Busca productos o selecciona una categoría</small>
                    </div>
                </div>
                
                <div class="carrito-actions">
                    <button class="btn-cargar" onclick="mostrarCarritosGuardados()">📂 Cargar Cuenta</button>
                    <button class="btn-cancelar" onclick="cancelarCuenta()">❌ Cancelar</button>
                    <button class="btn-guardar" onclick="guardarCuenta()">💾 Guardar</button>
                    <button class="btn-finalizar" onclick="finalizarCuenta()">✅ Finalizar</button>
                </div>
            </div>
        </div>
        
        <div id="cobro-message"></div>
    `;

    // Inicializar carrito VACÍO
    window.carritoCobro = [];
    
    // Cargar categorías para el cobro
    await cargarCategoriasCobro();
    
    // Actualizar carrito (se mostrará vacío)
    actualizarCarritoCobro();
}

// 👥 FUNCIONES PARA USUARIOS
async function loadUsuarios() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="section-header">
            <h2>👥 Gestión de Usuarios</h2>
            <button class="btn-primary" onclick="showFormUsuario()">+ Nuevo Usuario</button>
        </div>
        
        <div class="usuarios-container">
            <div id="form-usuario" class="form-container" style="display: none;">
                <h3 id="form-title-usuario">Nuevo Usuario</h3>
                <form id="usuario-form">
                    <input type="hidden" id="usuario-id">
                    <input type="text" id="usuario-username" placeholder="Nombre de usuario" required>
                    <input type="password" id="usuario-password" placeholder="Contraseña" required>
                    <select id="usuario-tipo" required>
                        <option value="">Seleccionar tipo</option>
                        <option value="cajero">Cajero</option>
                        <option value="administrador">Administrador</option>
                    </select>
                    <div class="form-buttons">
                        <button type="submit" id="btn-submit-usuario">Guardar</button>
                        <button type="button" onclick="hideFormUsuario()">Cancelar</button>
                    </div>
                </form>
            </div>
            
            <div id="lista-usuarios" class="lista-container">
                <h3>Lista de Usuarios</h3>
                <div id="usuarios-list" class="grid-list">
                    <!-- Los usuarios se cargarán aquí -->
                </div>
            </div>
        </div>
        
        <div id="usuarios-message"></div>
    `;

    // Configurar el formulario
    document.getElementById('usuario-form').addEventListener('submit', guardarUsuario);
    
    // Cargar usuarios existentes
    await cargarListaUsuarios();
}

async function cargarListaUsuarios() {
    try {
        const response = await fetch('/api/usuarios');
        const usuarios = await response.json();
        
        const lista = document.getElementById('usuarios-list');
        lista.innerHTML = '';
        
        if (usuarios.length === 0) {
            lista.innerHTML = '<p class="no-data">No hay usuarios registrados</p>';
            return;
        }
        
        usuarios.forEach(usuario => {
            const usuarioDiv = document.createElement('div');
            usuarioDiv.className = 'card';
            usuarioDiv.innerHTML = `
                <div class="card-content">
                    <h4>${usuario.username}</h4>
                    <p><strong>Tipo:</strong> ${usuario.tipo}</p>
                    <div class="card-actions">
                        <button class="btn-edit" onclick="editarUsuario(${usuario.id}, '${usuario.username}', '${usuario.tipo}')">✏️ Editar</button>
                        ${usuario.username !== 'admin' ? 
                            `<button class="btn-delete" onclick="eliminarUsuario(${usuario.id})">🗑️ Eliminar</button>` : 
                            `<button class="btn-disabled" disabled>No eliminable</button>`
                        }
                    </div>
                </div>
            `;
            lista.appendChild(usuarioDiv);
        });
        
    } catch (error) {
        mostrarMensajeUsuarios('Error cargando usuarios', 'error');
    }
}

function showFormUsuario() {
    document.getElementById('form-usuario').style.display = 'block';
    document.getElementById('form-title-usuario').textContent = 'Nuevo Usuario';
    document.getElementById('usuario-id').value = '';
    document.getElementById('usuario-username').value = '';
    document.getElementById('usuario-password').value = '';
    document.getElementById('usuario-tipo').value = '';
    document.getElementById('btn-submit-usuario').textContent = 'Guardar';
}

function hideFormUsuario() {
    document.getElementById('form-usuario').style.display = 'none';
}

function editarUsuario(id, username, tipo) {
    document.getElementById('form-usuario').style.display = 'block';
    document.getElementById('form-title-usuario').textContent = 'Editar Usuario';
    document.getElementById('usuario-id').value = id;
    document.getElementById('usuario-username').value = username;
    document.getElementById('usuario-password').value = ''; // Vacío para no cambiar si no se quiere
    document.getElementById('usuario-tipo').value = tipo;
    document.getElementById('btn-submit-usuario').textContent = 'Actualizar';
}

async function guardarUsuario(e) {
    e.preventDefault();
    
    const id = document.getElementById('usuario-id').value;
    const username = document.getElementById('usuario-username').value;
    const password = document.getElementById('usuario-password').value;
    const tipo = document.getElementById('usuario-tipo').value;
    
    // Validaciones
    if (!username || !tipo) {
        mostrarMensajeUsuarios('Todos los campos son requeridos', 'error');
        return;
    }
    
    if (!id && !password) {
        mostrarMensajeUsuarios('La contraseña es requerida para nuevos usuarios', 'error');
        return;
    }
    
    const usuarioData = { username, tipo };
    if (password) {
        usuarioData.password = password;
    }
    
    const url = id ? `/api/usuarios/${id}` : '/api/usuarios';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarioData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensajeUsuarios(data.mensaje, 'success');
            hideFormUsuario();
            await cargarListaUsuarios();
        } else {
            mostrarMensajeUsuarios(data.error, 'error');
        }
    } catch (error) {
        mostrarMensajeUsuarios('Error de conexión', 'error');
    }
}

async function eliminarUsuario(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensajeUsuarios(data.mensaje, 'success');
            await cargarListaUsuarios();
        } else {
            mostrarMensajeUsuarios(data.error, 'error');
        }
    } catch (error) {
        mostrarMensajeUsuarios('Error de conexión', 'error');
    }
}

function mostrarMensajeUsuarios(mensaje, tipo) {
    const messageDiv = document.getElementById('usuarios-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `message ${tipo}`;
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 3000);
}

// 🐛 FUNCIÓN DEBUG MEJORADA - Coloca esto al FINAL de app.js
function debugCarrito() {
    console.log('=== 🐛 DEBUG DEL SISTEMA DE COBRO ===');
    
    // Información del carrito
    console.log('📦 CARRITO:');
    console.log('- Items:', window.carritoCobro.length);
    console.log('- Total calculado:', document.getElementById('total-carrito').textContent);
    console.log('- Detalles:', window.carritoCobro);
    
    // Calcular total manualmente para verificar
    let totalManual = 0;
    window.carritoCobro.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalManual += subtotal;
        console.log(`  ${item.nombre}: ${item.cantidad} x $${item.precio} = $${subtotal}`);
    });
    console.log('- Total manual:', totalManual.toFixed(2));
    
    // Información de la sesión
    console.log('👤 SESIÓN:');
    fetch('/api/user')
        .then(r => r.json())
        .then(userData => {
            console.log('- Usuario:', userData.user);
        })
        .catch(err => {
            console.log('- Error obteniendo usuario:', err);
        });
    
    console.log('=== FIN DEBUG ===');
}

// Función para probar la API de ventas
function testVenta() {
    console.log('🧪 Probando API de ventas...');
    
    const ventaTest = {
        total: 100.50,
        productos: [
            { id: 1, nombre: "Producto Test", precio: 50.25, cantidad: 2 }
        ]
    };
    
    fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaTest)
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Respuesta API ventas:', data);
    })
    .catch(error => {
        console.log('❌ Error API ventas:', error);
    });
}

// 🧾 FUNCIONES COMPLETAS PARA VENTAS Y REPORTES
async function loadVentas() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="ventas-container">
            <div class="section-header">
                <h2>🧾 Reportes de Ventas</h2>
                <div class="ventas-actions">
                    <button class="btn-primary" onclick="generarCorteZ()">📊 Corte Z</button>
                    <button class="btn-secondary" onclick="cargarVentasHoy()">🕐 Hoy</button>
                    <button class="btn-secondary" onclick="cargarVentasSemana()">📅 Esta Semana</button>
                    <button class="btn-secondary" onclick="cargarVentasMes()">📆 Este Mes</button>
                    <button class="btn-secondary" onclick="cargarTodasLasVentas()">📋 Todas</button>
                    <button class="btn-tertiary" onclick="mostrarReportesAvanzados()">📈 Reportes Avanzados</button>
                </div>
            </div>
            
            <div class="filtros-ventas">
                <div class="filtro-group">
                    <label>Fecha:</label>
                    <input type="date" id="fecha-ventas" value="${obtenerFechaHoy()}">
                </div>
                <div class="filtro-group">
                    <label>Usuario:</label>
                    <select id="usuario-ventas">
                        <option value="">Todos los usuarios</option>
                    </select>
                </div>
                <button onclick="aplicarFiltrosVentas()">🔍 Aplicar Filtros</button>
            </div>
            
            <div id="contenido-ventas">
                <div class="ventas-welcome">
                    <h3>Selecciona una opción para ver los reportes</h3>
                    <p>Usa "Corte Z" para ver el resumen por categorías del día</p>
                    <p>O explora los "Reportes Avanzados" para análisis detallados</p>
                </div>
            </div>
        </div>
    `;

    // Cargar lista de usuarios para el filtro
    await cargarUsuariosParaFiltro();
}

// 🗓️ FUNCIONES UTILITARIAS PARA FECHAS
function obtenerFechaHoy() {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
}

function obtenerInicioSemana() {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const inicioSemana = new Date(hoy.setDate(diff));
    return inicioSemana.toISOString().split('T')[0];
}

function obtenerFinSemana() {
    const inicio = new Date(obtenerInicioSemana());
    inicio.setDate(inicio.getDate() + 6);
    return inicio.toISOString().split('T')[0];
}

function obtenerInicioMes() {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
}

function obtenerFinMes() {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
}

function obtenerMesAnterior() {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0];
}

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 👥 CARGAR USUARIOS PARA FILTRO
async function cargarUsuariosParaFiltro() {
    try {
        const response = await fetch('/api/usuarios');
        const usuarios = await response.json();
        
        const select = document.getElementById('usuario-ventas');
        select.innerHTML = '<option value="">Todos los usuarios</option>';
        
        usuarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.id;
            option.textContent = `${usuario.username} (${usuario.tipo})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// 🔍 FILTRAR VENTAS
async function aplicarFiltrosVentas() {
    const fecha = document.getElementById('fecha-ventas').value;
    const usuarioId = document.getElementById('usuario-ventas').value;
    
    if (!fecha) {
        mostrarMensajeVentas('Selecciona una fecha', 'error');
        return;
    }
    
    await cargarVentasPorFecha(fecha, usuarioId);
}

// 🎯 CORTE Z - FUNCIÓN PRINCIPAL
async function generarCorteZ() {
    const fecha = document.getElementById('fecha-ventas').value || obtenerFechaHoy();
    
    try {
        const response = await fetch(`/api/ventas/corte?fecha=${fecha}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }
        
        mostrarCorteZ(data, fecha);
        
    } catch (error) {
        console.error('Error generando corte Z:', error);
        mostrarMensajeVentas('Error generando corte Z: ' + error.message, 'error');
    }
}

// 📊 MOSTRAR CORTE Z
function mostrarCorteZ(data, fecha) {
    const contenido = document.getElementById('contenido-ventas');
    
    let html = `
        <div class="corte-z-container">
            <div class="corte-header">
                <h3>📊 Corte Z - ${formatearFecha(fecha)}</h3>
                <button class="btn-imprimir" onclick="imprimirCorteZ()">🖨️ Imprimir</button>
            </div>
            
            <div class="resumen-general">
                <div class="resumen-item">
                    <span>Total Ventas:</span>
                    <strong>$${data.totales.general.total_ventas.toFixed(2)}</strong>
                </div>
                <div class="resumen-item">
                    <span>N° de Ventas:</span>
                    <strong>${data.totales.general.total_ventas_cantidad}</strong>
                </div>
                <div class="resumen-item">
                    <span>Promedio por Venta:</span>
                    <strong>$${data.totales.general.promedio_venta.toFixed(2)}</strong>
                </div>
            </div>
            
            <div class="corte-categorias">
                <h4>📁 Ventas por Categoría</h4>
                <div class="categorias-grid">
    `;
    
    data.totales.categorias.forEach(cat => {
        html += `
            <div class="categoria-item-corte">
                <div class="categoria-nombre">${cat.categoria_nombre || 'Sin categoría'}</div>
                <div class="categoria-totales">
                    <div class="categoria-ventas">${cat.total_ventas} ventas</div>
                    <div class="categoria-monto">$${cat.monto_total.toFixed(2)}</div>
                </div>
                <div class="categoria-porcentaje">${cat.porcentaje}% del total</div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <div class="productos-destacados">
                <h4>🏆 Productos Más Vendidos</h4>
                <div class="productos-lista-corte">
    `;
    
    data.productos_mas_vendidos.forEach((prod, index) => {
        html += `
            <div class="producto-item-corte">
                <div class="producto-rank">#${index + 1}</div>
                <div class="producto-info">
                    <div class="producto-nombre">${prod.nombre}</div>
                    <div class="producto-detalles">
                        <span>${prod.total_vendido} unidades</span>
                        <span>$${prod.monto_total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <div class="corte-footer">
                <div class="footer-info">
                    <p><strong>Fecha de generación:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Usuario:</strong> ${data.usuario_actual.username}</p>
                </div>
            </div>
        </div>
    `;
    
    contenido.innerHTML = html;
}

// 📅 CARGAR VENTAS POR PERIODO
async function cargarVentasHoy() {
    const hoy = obtenerFechaHoy();
    document.getElementById('fecha-ventas').value = hoy;
    await cargarVentasPorFecha(hoy);
}

async function cargarVentasSemana() {
    const fechaInicio = obtenerInicioSemana();
    const fechaFin = obtenerFinSemana();
    await cargarVentasPorRango(fechaInicio, fechaFin, 'esta semana');
}

async function cargarVentasMes() {
    const fechaInicio = obtenerInicioMes();
    const fechaFin = obtenerFinMes();
    await cargarVentasPorRango(fechaInicio, fechaFin, 'este mes');
}

async function cargarTodasLasVentas() {
    document.getElementById('fecha-ventas').value = '';
    await cargarVentasPorFecha('');
}

// 📋 CARGAR Y MOSTRAR VENTAS
async function cargarVentasPorFecha(fecha, usuarioId = '') {
    try {
        let url = '/api/ventas';
        if (fecha) {
            url += `?fecha=${fecha}`;
            if (usuarioId) {
                url += `&usuario_id=${usuarioId}`;
            }
        } else if (usuarioId) {
            url += `?usuario_id=${usuarioId}`;
        }
        
        const response = await fetch(url);
        const ventas = await response.json();
        
        mostrarListaVentas(ventas, fecha);
        
    } catch (error) {
        console.error('Error cargando ventas:', error);
        mostrarMensajeVentas('Error cargando ventas', 'error');
    }
}

async function cargarVentasPorRango(fechaInicio, fechaFin, periodoNombre) {
    try {
        const response = await fetch(`/api/ventas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
        const ventas = await response.json();
        
        mostrarListaVentas(ventas, periodoNombre);
        
    } catch (error) {
        console.error('Error cargando ventas por rango:', error);
        mostrarMensajeVentas('Error cargando ventas', 'error');
    }
}

function mostrarListaVentas(ventas, fecha) {
    const contenido = document.getElementById('contenido-ventas');
    
    let html = `
        <div class="lista-ventas-container">
            <div class="ventas-header-with-back">
                <h3>📋 ${fecha ? `Ventas del ${formatearFecha(fecha)}` : 'Todas las Ventas'}</h3>
                <button class="btn-volver-menu" onclick="loadVentas()">← Volver al Menú</button>
            </div>
            <div class="ventas-stats">
                <span>Total: ${ventas.length} ventas</span>
                <small>Mostrando en horario local (CDMX)</small>
            </div>
            <div class="ventas-lista">
    `;
    
    if (ventas.length === 0) {
        html += `<div class="no-ventas">No hay ventas para mostrar</div>`;
    } else {
        ventas.forEach(venta => {
            // ✅ USAR FECHA FORMATEADA DEL BACKEND
            const fechaVenta = venta.fecha_formateada || 'Fecha no disponible';
            
            html += `
                <div class="venta-item">
                    <div class="venta-header">
                        <div class="venta-id">Venta #${venta.id}</div>
                        <div class="venta-fecha" title="${venta.fecha_completa || ''}">${fechaVenta}</div>
                    </div>
                    <div class="venta-info">
                        <div class="venta-usuario">Cajero: ${venta.usuario_nombre || 'N/A'}</div>
                        <div class="venta-total">Total: $${venta.total.toFixed(2)}</div>
                    </div>
                    <div class="venta-productos">
                        ${venta.productos_vendidos.map(p => 
                            `${p.cantidad}x ${p.nombre}`
                        ).join(', ')}
                    </div>
                    <div class="venta-actions">
                        <button class="btn-reimprimir" onclick="reimprimirTicket(${venta.id})">🖨️ Reimprimir Ticket</button>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div></div>`;
    contenido.innerHTML = html;
}

// Función para reimprimir ticket (placeholder)
function reimprimirTicket(ventaId) {
    mostrarMensajeVentas(`Función de reimpresión para venta #${ventaId} en desarrollo`, 'info');
}

// 📈 REPORTES AVANZADOS
async function mostrarReportesAvanzados() {
    const contenido = document.getElementById('contenido-ventas');
    
    contenido.innerHTML = `
        <div class="reportes-avanzados">
            <h3>📈 Reportes Avanzados</h3>
            
            <div class="reportes-grid">
                <div class="reporte-card" onclick="generarReporteCajeros()">
                    <div class="reporte-icon">👤</div>
                    <div class="reporte-info">
                        <h4>Ventas por Cajero</h4>
                        <p>Comparativa de ventas por usuario</p>
                    </div>
                </div>
                
                <div class="reporte-card" onclick="generarReporteProductos()">
                    <div class="reporte-icon">📦</div>
                    <div class="reporte-info">
                        <h4>Productos Más Vendidos</h4>
                        <p>Top productos por periodo</p>
                    </div>
                </div>
                
                <div class="reporte-card" onclick="generarReporteComparativo()">
                    <div class="reporte-icon">📊</div>
                    <div class="reporte-info">
                        <h4>Comparativa de Periodos</h4>
                        <p>Vs. mes anterior</p>
                    </div>
                </div>
                
                <div class="reporte-card" onclick="generarReporteTendencias()">
                    <div class="reporte-icon">📈</div>
                    <div class="reporte-info">
                        <h4>Tendencias de Ventas</h4>
                        <p>Evolución diaria/semanal</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 👤 REPORTE POR CAJERO
async function generarReporteCajeros() {
    try {
        const fechaInicio = document.getElementById('fecha-ventas').value || obtenerInicioMes();
        const fechaFin = fechaInicio ? fechaInicio : obtenerFinMes();
        
        const response = await fetch(`/api/ventas/reporte/cajeros?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        mostrarReporteCajeros(data, fechaInicio, fechaFin);
        
    } catch (error) {
        console.error('Error reporte cajeros:', error);
        mostrarMensajeVentas('Error: ' + error.message, 'error');
    }
}

function mostrarReporteCajeros(data, fechaInicio, fechaFin) {
    const contenido = document.getElementById('contenido-ventas');
    
    let html = `
        <div class="reporte-container">
            <div class="reporte-header">
                <h3>👤 Ventas por Cajero</h3>
                <p>Periodo: ${formatearFecha(fechaInicio)} a ${formatearFecha(fechaFin)}</p><br>
                <button class="btn-volver-menu" onclick="mostrarReportesAvanzados()">← Volver a Reportes</button><br>
            </div>
            
            <div class="reporte-cajeros">
    `;
    
    if (data.length === 0) {
        html += `<div class="no-data">No hay datos para mostrar</div>`;
    } else {
        data.forEach((cajero, index) => {
            html += `
                <div class="cajero-item ${index === 0 ? 'top-cajero' : ''}">
                    <div class="cajero-rank">#${index + 1}</div>
                    <div class="cajero-info">
                        <div class="cajero-nombre">${cajero.cajero}</div>
                        <div class="cajero-tipo">${cajero.tipo}</div>
                    </div>
                    <div class="cajero-stats">
                        <div class="stat">
                            <span>Ventas:</span>
                            <strong>${cajero.total_ventas}</strong>
                        </div>
                        <div class="stat">
                            <span>Total:</span>
                            <strong>$${cajero.monto_total.toFixed(2)}</strong>
                        </div>
                        <div class="stat">
                            <span>Promedio:</span>
                            <strong>$${cajero.promedio_venta.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div></div>`;
    contenido.innerHTML = html;
}

// 📦 REPORTE POR PRODUCTO
async function generarReporteProductos() {
    try {
        const fechaInicio = document.getElementById('fecha-ventas').value || obtenerInicioMes();
        const fechaFin = fechaInicio ? fechaInicio : obtenerFinMes();
        
        const response = await fetch(`/api/ventas/reporte/productos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        mostrarReporteProductos(data, fechaInicio, fechaFin);
        
    } catch (error) {
        console.error('Error reporte productos:', error);
        mostrarMensajeVentas('Error: ' + error.message, 'error');
    }
}

function mostrarReporteProductos(data, fechaInicio, fechaFin) {
    const contenido = document.getElementById('contenido-ventas');
    
    let html = `
        <div class="reporte-container">
            <div class="reporte-header">
                <h3>📦 Productos Más Vendidos</h3>
                <p>Periodo: ${formatearFecha(fechaInicio)} a ${formatearFecha(fechaFin)}</p><br>
                <button class="btn-volver-menu" onclick="mostrarReportesAvanzados()">← Volver a Reportes</button><br>
            </div>
            
            <div class="reporte-productos">
    `;
    
    if (data.length === 0) {
        html += `<div class="no-data">No hay datos para mostrar</div>`;
    } else {
        data.forEach((producto, index) => {
            html += `
                <div class="producto-reporte-item ${index < 3 ? 'top-producto' : ''}">
                    <div class="producto-rank">#${index + 1}</div>
                    <div class="producto-info">
                        <div class="producto-nombre">${producto.nombre}</div>
                        <div class="producto-detalles">
                            <span>${producto.total_vendido} unidades vendidas</span>
                        </div>
                    </div>
                    <div class="producto-totales">
                        <div class="total-monto">$${producto.monto_total.toFixed(2)}</div>
                        <div class="total-unidades">${producto.total_vendido} unid.</div>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div></div>`;
    contenido.innerHTML = html;
}

// 📊 REPORTE COMPARATIVO
async function generarReporteComparativo() {
    try {
        const periodoActual = obtenerInicioMes();
        const periodoAnterior = obtenerMesAnterior();
        
        const response = await fetch(`/api/ventas/reporte/comparativo?periodo_actual=${periodoActual}&periodo_anterior=${periodoAnterior}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        mostrarReporteComparativo(data, periodoActual, periodoAnterior);
        
    } catch (error) {
        console.error('Error reporte comparativo:', error);
        mostrarMensajeVentas('Error: ' + error.message, 'error');
    }
}

function mostrarReporteComparativo(data, periodoActual, periodoAnterior) {
    const contenido = document.getElementById('contenido-ventas');
    
    const variacion = ((data.actual.total_ventas - data.anterior.total_ventas) / data.anterior.total_ventas * 100) || 0;
    const tendencia = variacion >= 0 ? '📈' : '📉';
    
    let html = `
        <div class="reporte-container">
            <div class="reporte-header">
                <h3>📊 Comparativa de Ventas</h3>
                <p>${formatearFecha(periodoActual)} vs ${formatearFecha(periodoAnterior)}</p><br>
                <button class="btn-volver-menu" onclick="mostrarReportesAvanzados()">← Volver a Reportes</button>

            </div>
            
            <div class="comparativa-general">
                <div class="comparativa-item actual">
                    <h4>Mes Actual</h4>
                    <div class="total">$${data.actual.total_ventas.toFixed(2)}</div>
                    <div class="ventas-count">${data.actual.total_ventas_cantidad} ventas</div>
                </div>
                
                <div class="comparativa-variacion ${variacion >= 0 ? 'positiva' : 'negativa'}">
                    <div class="variacion-icon">${tendencia}</div>
                    <div class="variacion-porcentaje">${Math.abs(variacion).toFixed(1)}%</div>
                    <div class="variacion-texto">${variacion >= 0 ? 'Aumento' : 'Disminución'}</div>
                </div>
                
                <div class="comparativa-item anterior">
                    <h4>Mes Anterior</h4>
                    <div class="total">$${data.anterior.total_ventas.toFixed(2)}</div>
                    <div class="ventas-count">${data.anterior.total_ventas_cantidad} ventas</div>
                </div>
            </div>
        </div>
    `;
    
    contenido.innerHTML = html;
}

// 📈 REPORTE TENDENCIAS
async function generarReporteTendencias() {
    try {
        const dias = 30;
        const response = await fetch(`/api/ventas/reporte/tendencias?dias=${dias}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        mostrarReporteTendencias(data, dias);
        
    } catch (error) {
        console.error('Error reporte tendencias:', error);
        mostrarMensajeVentas('Error: ' + error.message, 'error');
    }
}

function mostrarReporteTendencias(data, dias) {
    const contenido = document.getElementById('contenido-ventas');
    
    let html = `
        <div class="reporte-container">
            <div class="reporte-header">
                <h3>📈 Tendencias de Ventas</h3>
                <p>Últimos ${dias} días</p>
                <button class="btn-volver-menu" onclick="mostrarReportesAvanzados()">← Volver a Reportes</button>

            </div>
                        
            <div class="tendencias-stats">
                <div class="tendencia-stat">
                    <span>Promedio Diario:</span>
                    <strong>$${data.promedio_diario.toFixed(2)}</strong>
                </div>
                <div class="tendencia-stat">
                    <span>Mejor Día:</span>
                    <strong>$${data.mejor_dia.monto.toFixed(2)}</strong>
                    <small>${formatearFecha(data.mejor_dia.fecha)}</small>
                </div>
                <div class="tendencia-stat">
                    <span>Total Periodo:</span>
                    <strong>$${data.total_periodo.toFixed(2)}</strong>
                </div>
            </div>
            
            <div class="tendencias-lista">
                <h4>📅 Ventas por Día</h4>
    `;
    
    data.tendencias.forEach(tendencia => {
        html += `
            <div class="tendencia-item">
                <div class="tendencia-fecha">${formatearFecha(tendencia.fecha)}</div>
                <div class="tendencia-monto">$${tendencia.total.toFixed(2)}</div>
                <div class="tendencia-ventas">${tendencia.cantidad_ventas} ventas</div>
            </div>
        `;
    });
    
    html += `</div></div>`;
    contenido.innerHTML = html;
}

// 🖨️ IMPRIMIR CORTE Z (placeholder)
function imprimirCorteZ() {
    mostrarMensajeVentas('Función de impresión en desarrollo', 'info');
}

// 💬 MOSTRAR MENSAJES
function mostrarMensajeVentas(mensaje, tipo) {
    const messageDiv = document.getElementById('cobro-message') || document.createElement('div');
    messageDiv.textContent = mensaje;
    messageDiv.className = `message ${tipo}`;
    
    if (!document.getElementById('cobro-message')) {
        messageDiv.id = 'ventas-message';
        document.querySelector('.ventas-container').appendChild(messageDiv);
    }
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 3000);
}
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

//----------------------------------------------------------------------------------------------------------------------------------------
// Cargar aplicación principal
function loadApp(user) {
    const app = document.getElementById('app');
    
    if (user.tipo === 'administrador') {
        app.innerHTML = `
            <div class="dashboard">
                <header>
                    <h1>🏪 POS Tienda - ¡Bonito dia! - Administrador</h1>
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
//************************************************************************************************************************* */
//-----------------------------------------------CATEGORIAS----------------------------------------------------------------
//************************************************************************************************************************* */

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

//************************************************************************************************************************* */
//-----------------------------------------------PRODUCTOS----------------------------------------------------------------
//************************************************************************************************************************* */

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

//************************************************************************************************************************* */
//-----------------------------------------------COBRO---------------------------------------------------------------------
//************************************************************************************************************************* */

// 💵 FUNCIONES PARA COBRO - VERSIÓN CORREGIDA
// 🔧 ACTUALIZA LA FUNCIÓN loadCobro - AGREGA LA INICIALIZACIÓN:
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
                           autocomplete="off">
                    <button onclick="buscarProductoCobro()">Buscar</button>
                    <!-- Aquí se mostrarán los resultados predictivos -->
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
    
    // 🚀 INICIALIZAR BÚSQUEDA PREDICTIVA
    setTimeout(() => {
        inicializarBusquedaPredictiva();
    }, 100);
    
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

// 📋 ACTUALIZA COMPLETAMENTE LA FUNCIÓN actualizarCarritoCobro:
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
                    <span class="item-precio">$${parseFloat(item.precio).toFixed(2)} c/u</span>
                    <span class="item-subtotal">$${subtotal.toFixed(2)}</span>
                </div>
            </div>
            <div class="item-cantidad-controls">
                <button class="btn-cantidad btn-menos" onclick="modificarCantidad(${index}, -1)">−</button>
                <span class="cantidad-display">${item.cantidad}</span>
                <button class="btn-cantidad btn-mas" onclick="modificarCantidad(${index}, 1)">+</button>
                <button class="btn-quitar" onclick="quitarDelCarritoCobro(${index})" title="Eliminar todo">🗑️</button>
            </div>
        `;
        lista.appendChild(itemDiv);
    });
    
    totalElement.textContent = total.toFixed(2);
}

// ➕➖ NUEVA FUNCIÓN PARA MODIFICAR CANTIDADES
function modificarCantidad(index, cambio) {
    if (!window.carritoCobro || !window.carritoCobro[index]) {
        console.error('Índice inválido para modificar cantidad');
        return;
    }
    
    const item = window.carritoCobro[index];
    const nuevaCantidad = item.cantidad + cambio;
    
    // Validar que la cantidad no sea menor a 1
    if (nuevaCantidad < 1) {
        // Si queda en 0, eliminar el producto
        quitarDelCarritoCobro(index);
        return;
    }
    
    // Validar stock si controla inventario
    if (item.control_inventario) {
        // Verificar stock disponible (necesitamos obtener el stock actual)
        verificarStockDisponible(item.id, nuevaCantidad).then(stockSuficiente => {
            if (stockSuficiente) {
                item.cantidad = nuevaCantidad;
                actualizarCarritoCobro();
                mostrarMensajeCobro(`📦 ${item.nombre}: ${nuevaCantidad} unidades`, 'success');
            } else {
                mostrarMensajeCobro(`❌ No hay suficiente stock de ${item.nombre}`, 'error');
            }
        });
    } else {
        // Productos sin control de inventario
        item.cantidad = nuevaCantidad;
        actualizarCarritoCobro();
        mostrarMensajeCobro(`📦 ${item.nombre}: ${nuevaCantidad} unidades`, 'success');
    }
}

// 📦 FUNCIÓN PARA VERIFICAR STOCK (NUEVA)
async function verificarStockDisponible(productoId, cantidadRequerida) {
    try {
        const response = await fetch('/api/productos');
        const productos = await response.json();
        const producto = productos.find(p => p.id == productoId);
        
        return producto && producto.stock >= cantidadRequerida;
    } catch (error) {
        console.error('Error verificando stock:', error);
        return true; // En caso de error, permitir la operación
    }
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

// 📋 REEMPLAZA COMPLETAMENTE LA FUNCIÓN finalizarCuenta:
async function finalizarCuenta() {
    if (!window.carritoCobro || window.carritoCobro.length === 0) {
        mostrarMensajeCobro('El carrito está vacío', 'error');
        return;
    }
    
    const total = parseFloat(document.getElementById('total-carrito').textContent);
    
    // ✅ CORRECCIÓN: Asegurar que el HTML del modal incluya la sección de referencia
    const modalPago = `
        <div class="modal-pago-overlay" id="modalPagoOverlay">
            <div class="modal-pago" style="max-width: 500px;">
                <h3>💳 Procesar Pago</h3>
                
                <div class="pago-info">
                    <div class="total-a-pagar">
                        <span>Total a pagar:</span>
                        <strong>$${total.toFixed(2)}</strong>
                    </div>
                </div>
                
                <!-- Métodos de pago -->
                <div class="metodos-pago-container">
                    <label>💳 Método de pago:</label>
                    <div class="metodos-pago-grid">
                        <div class="metodo-pago-item" data-metodo="efectivo">
                            <div class="metodo-icon">💵</div>
                            <div class="metodo-nombre">Efectivo</div>
                        </div>
                        <div class="metodo-pago-item" data-metodo="tarjeta_credito">
                            <div class="metodo-icon">💳</div>
                            <div class="metodo-nombre">Tarjeta Crédito</div>
                        </div>
                        <div class="metodo-pago-item" data-metodo="tarjeta_debito">
                            <div class="metodo-icon">🏦</div>
                            <div class="metodo-nombre">Tarjeta Débito</div>
                        </div>
                        <div class="metodo-pago-item" data-metodo="tarjeta_digital">
                            <div class="metodo-icon">📱</div>
                            <div class="metodo-nombre">Tarjeta Digital</div>
                        </div>
                        <div class="metodo-pago-item" data-metodo="transferencia">
                            <div class="metodo-icon">🔄</div>
                            <div class="metodo-nombre">Transferencia</div>
                        </div>
                        <div class="metodo-pago-item" data-metodo="cheque">
                            <div class="metodo-icon">📄</div>
                            <div class="metodo-nombre">Cheque</div>
                        </div>
                    </div>
                </div>
                
                <!-- Sección dinámica -->
                <div id="seccion-pago-dinamica">
                    <!-- Se llenará dinámicamente -->
                </div>
                
                <!-- ✅ CORRECCIÓN: Asegurar que la sección de referencia esté presente -->
                <div class="referencia-pago-container" id="referenciaContainer" style="display: none;">
                    <label id="labelReferencia">Número de referencia:</label>
                    <input type="text" id="referenciaPago" placeholder="Ingresa el número de referencia..." autocomplete="off">
                    <small id="helpReferencia">Opcional para llevar un mejor control</small>
                </div>
                
                <div class="pago-botones">
                    <button onclick="cerrarModalPago()">Cancelar</button>
                    <button onclick="confirmarPago(${total})" class="btn-confirmar" id="btnConfirmarPago">✅ Confirmar Venta</button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar el modal al body
    document.body.insertAdjacentHTML('beforeend', modalPago);
    
    // Configurar eventos de métodos de pago
    configurarMetodosPago(total);
    
    // Seleccionar efectivo por defecto
    seleccionarMetodoPago('efectivo');
}

// 🆕 FUNCIÓN PARA CONFIGURAR MÉTODOS DE PAGO
// 🆕 FUNCIÓN MEJORADA PARA CONFIGURAR MÉTODOS DE PAGO
function configurarMetodosPago(total) {
    console.log('⚙️ Configurando métodos de pago...');
    
    // Eventos para selección de método
    document.querySelectorAll('.metodo-pago-item').forEach(item => {
        item.addEventListener('click', function() {
            const metodo = this.getAttribute('data-metodo');
            console.log('🎯 Clic en método:', metodo);
            seleccionarMetodoPago(metodo);
        });
    });
    
    // Evento para monto recibido (solo efectivo)
    const montoInput = document.getElementById('montoRecibido');
    if (montoInput) {
        montoInput.addEventListener('input', function() {
            console.log('💰 Cambio en monto recibido:', this.value);
            calcularCambioMejorado(total);
        });
        
        montoInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                console.log('↵ Enter presionado - confirmando pago');
                confirmarPago(total);
            }
        });
        
        // Enfocar y seleccionar el input
        montoInput.focus();
        montoInput.select();
    }
    
    console.log('✅ Métodos de pago configurados');
}

// 🆕 FUNCIÓN PARA CAMBIAR MÉTODO DE PAGO
// 🆕 FUNCIÓN CORREGIDA PARA CAMBIAR MÉTODO DE PAGO
function seleccionarMetodoPago(metodo) {
    console.log('🔘 Seleccionando método:', metodo);
    
    // Remover selección anterior
    document.querySelectorAll('.metodo-pago-item').forEach(item => {
        item.classList.remove('seleccionado');
    });
    
    // Seleccionar nuevo método
    const elementoSeleccionado = document.querySelector(`[data-metodo="${metodo}"]`);
    if (elementoSeleccionado) {
        elementoSeleccionado.classList.add('seleccionado');
        console.log('✅ Método seleccionado visualmente:', metodo);
    } else {
        console.error('❌ No se encontró el elemento del método:', metodo);
        return;
    }
    
    // Actualizar interfaz según método
    actualizarInterfazPorMetodo(metodo);
}

// 🆕 FUNCIÓN PARA ACTUALIZAR INTERFAZ SEGÚN MÉTODO
// 🆕 FUNCIÓN COMPLETAMENTE CORREGIDA
function actualizarInterfazPorMetodo(metodo) {
    console.log('🔄 Actualizando interfaz para método:', metodo);
    
    const seccionDinamica = document.getElementById('seccion-pago-dinamica');
    const referenciaContainer = document.getElementById('referenciaContainer');
    const btnConfirmar = document.getElementById('btnConfirmarPago');
    
    if (!seccionDinamica || !btnConfirmar) {
        console.error('❌ Elementos del modal no encontrados');
        return;
    }
    
    // Obtener el total del carrito
    const totalCarrito = parseFloat(document.querySelector('#total-carrito').textContent) || 0;
    console.log('💰 Total del carrito:', totalCarrito);
    
    // Configuraciones por método
    const configMetodos = {
        efectivo: {
            html: `
                <div class="seccion-efectivo">
                    <div class="pago-input">
                        <label>Monto recibido:</label>
                        <input type="number" id="montoRecibido" step="0.01" min="0" value="${totalCarrito.toFixed(2)}" autofocus>
                    </div>
                    
                    <div class="montos-rapidos">
                        <small>Monto rápido:</small>
                        <div class="botones-montos">
                            ${generarBotonesMontosRapidos(totalCarrito)}
                        </div>
                    </div>
                    
                    <div class="pago-resumen" id="pagoResumen">
                        <div class="cambio-item">
                            <span>Cambio a entregar:</span>
                            <strong id="cambioCalculado">$0.00</strong>
                        </div>
                        <div class="desglose-cambio" id="desgloseCambio"></div>
                    </div>
                </div>
            `,
            referencia: false,
            btnTexto: '✅ Confirmar Venta'
        },
        tarjeta_credito: {
            html: `
                <div class="seccion-tarjeta">
                    <p>💳 <strong>Tarjeta de Crédito</strong></p>
                    <p>Total: <strong>$${totalCarrito.toFixed(2)}</strong></p>
                    <small>Desliza o inserta la tarjeta en el terminal</small>
                </div>
            `,
            referencia: true,
            label: 'Número de autorización:',
            help: 'Ingresa el número de autorización de la transacción',
            btnTexto: '✅ Confirmar Pago con Tarjeta'
        },
        tarjeta_debito: {
            html: `
                <div class="seccion-tarjeta">
                    <p>🏦 <strong>Tarjeta de Débito</strong></p>
                    <p>Total: <strong>$${totalCarrito.toFixed(2)}</strong></p>
                    <small>Desliza o inserta la tarjeta en el terminal</small>
                </div>
            `,
            referencia: true,
            label: 'Número de autorización:',
            help: 'Ingresa el número de autorización de la transacción',
            btnTexto: '✅ Confirmar Pago con Tarjeta'
        },
        tarjeta_digital: {
            html: `
                <div class="seccion-digital">
                    <p>📱 <strong>Tarjeta Digital</strong></p>
                    <p>Total: <strong>$${totalCarrito.toFixed(2)}</strong></p>
                    <small>Escanea el código QR o usa tu app de pagos</small>
                </div>
            `,
            referencia: true,
            label: 'Referencia del pago:',
            help: 'Ingresa el número de referencia de la transacción digital',
            btnTexto: '✅ Confirmar Pago Digital'
        },
        transferencia: {
            html: `
                <div class="seccion-transferencia">
                    <p>🔄 <strong>Transferencia Bancaria</strong></p>
                    <p>Total: <strong>$${totalCarrito.toFixed(2)}</strong></p>
                    <small>Proporciona los datos bancarios al cliente</small>
                </div>
            `,
            referencia: true,
            label: 'Número de transferencia:',
            help: 'Ingresa el número de referencia de la transferencia',
            btnTexto: '✅ Confirmar Transferencia'
        },
        cheque: {
            html: `
                <div class="seccion-cheque">
                    <p>📄 <strong>Cheque</strong></p>
                    <p>Total: <strong>$${totalCarrito.toFixed(2)}</strong></p>
                    <small>Verifica los datos del cheque antes de aceptarlo</small>
                </div>
            `,
            referencia: true,
            label: 'Número de cheque:',
            help: 'Ingresa el número del cheque para control',
            btnTexto: '✅ Confirmar Pago con Cheque'
        }
    };
    
    const config = configMetodos[metodo] || configMetodos.efectivo;
    
    // Actualizar sección dinámica
    seccionDinamica.innerHTML = config.html;
    console.log('✅ Sección dinámica actualizada');
    
    // ✅ CORRECCIÓN CRÍTICA: Mostrar/ocultar referencia
    if (referenciaContainer) {
        if (config.referencia) {
            referenciaContainer.style.display = 'block';
            // Asegurar que los elementos existen antes de asignar
            const labelReferencia = document.getElementById('labelReferencia');
            const helpReferencia = document.getElementById('helpReferencia');
            const inputReferencia = document.getElementById('referenciaPago');
            
            if (labelReferencia) labelReferencia.textContent = config.label;
            if (helpReferencia) helpReferencia.textContent = config.help;
            if (inputReferencia) {
                inputReferencia.value = ''; // Limpiar valor anterior
                inputReferencia.placeholder = config.help;
                inputReferencia.required = true; // Hacer obligatorio
            }
            console.log('✅ Referencia mostrada para:', metodo);
        } else {
            referenciaContainer.style.display = 'none';
            // Limpiar el campo cuando no se necesita
            const inputReferencia = document.getElementById('referenciaPago');
            if (inputReferencia) {
                inputReferencia.value = '';
                inputReferencia.required = false;
            }
            console.log('✅ Referencia ocultada para:', metodo);
        }
    }
    
    // Actualizar botón de confirmación
    btnConfirmar.innerHTML = config.btnTexto;
    btnConfirmar.disabled = false; // Asegurar que no esté deshabilitado
    
    // ✅ CORRECCIÓN: Configurar eventos SI ES EFECTIVO
    if (metodo === 'efectivo') {
        setTimeout(() => {
            const montoInput = document.getElementById('montoRecibido');
            if (montoInput) {
                montoInput.focus();
                montoInput.select();
                
                // Calcular cambio inicial
                calcularCambioMejorado(totalCarrito);
                
                // Configurar evento para calcular cambio en tiempo real
                montoInput.addEventListener('input', function() {
                    calcularCambioMejorado(totalCarrito);
                });
            }
        }, 50);
    } else {
        // ✅ PARA MÉTODOS NO-EFECTIVO: NO MOSTRAR CAMBIO
        const pagoResumen = document.getElementById('pagoResumen');
        if (pagoResumen) {
            pagoResumen.innerHTML = `
                <div class="cambio-item sin-cambio">
                    <span>Pago exacto:</span>
                    <strong>$${totalCarrito.toFixed(2)}</strong>
                </div>
            `;
        }
    }
}

// 🎯 FUNCIÓN PARA GENERAR BOTONES DE MONTO RÁPIDO
function generarBotonesMontosRapidos(total) {
    const montosSugeridos = [];
    
    // Generar montos redondeados hacia arriba
    if (total <= 50) {
        montosSugeridos.push(20, 50, 100);
    } else if (total <= 100) {
        montosSugeridos.push(100, 200, 500);
    } else if (total <= 200) {
        montosSugeridos.push(200, 500, 1000);
    } else {
        // Para montos mayores, sugerir múltiplos de 100
        const multiplo = Math.ceil(total / 100) * 100;
        montosSugeridos.push(multiplo, multiplo + 100, multiplo + 200);
    }
    
    // Filtrar montos que sean mayores al total
    const montosValidos = montosSugeridos.filter(monto => monto >= total);
    
    // Tomar solo 3 montos
    const montosFinales = montosValidos.slice(0, 3);
    
    return montosFinales.map(monto => 
        `<button class="btn-monto-rapido" onclick="seleccionarMontoRapido(${monto})">$${monto}</button>`
    ).join('');
}

// 💵 FUNCIÓN PARA SELECCIONAR MONTO RÁPIDO
function seleccionarMontoRapido(monto) {
    const montoInput = document.getElementById('montoRecibido');
    montoInput.value = monto;
    
    // Disparar el evento de input para calcular cambio
    const event = new Event('input', { bubbles: true });
    montoInput.dispatchEvent(event);
    
    // Enfocar el input nuevamente
    montoInput.focus();
}

// 🧮 FUNCIÓN MEJORADA PARA CALCULAR CAMBIO
function calcularCambioMejorado(total) {
    const montoRecibido = parseFloat(document.getElementById('montoRecibido').value) || 0;
    const cambio = montoRecibido - total;
    const resumen = document.getElementById('pagoResumen');
    const cambioCalculado = document.getElementById('cambioCalculado');
    const btnConfirmar = document.getElementById('btnConfirmarPago');
    
    if (cambio >= 0) {
        // Cambio positivo - mostrar desglose
        resumen.innerHTML = `
            <div class="cambio-item positivo">
                <span>Cambio a entregar:</span>
                <strong id="cambioCalculado">$${cambio.toFixed(2)}</strong>
            </div>
            <div class="desglose-cambio" id="desgloseCambio">
                ${generarDesgloseCambio(cambio)}
            </div>
        `;
        resumen.className = 'pago-resumen positivo';
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = `✅ Confirmar Venta - Cambio: $${cambio.toFixed(2)}`;
    } else {
        // Pago insuficiente
        const faltante = Math.abs(cambio);
        resumen.innerHTML = `
            <div class="cambio-item negativo">
                <span>Faltante:</span>
                <strong>$${faltante.toFixed(2)}</strong>
            </div>
        `;
        resumen.className = 'pago-resumen negativo';
        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = '❌ Pago insuficiente';
    }
}

// 💵 FUNCIÓN PARA GENERAR DESGLOSE DE CAMBIO EN BILLETES
function generarDesgloseCambio(cambio) {
    if (cambio === 0) return '<small>Pago exacto - sin cambio</small>';
    
    const denominaciones = [
        { valor: 1000, nombre: 'Billete $1000', emoji: '💵' },
        { valor: 500, nombre: 'Billete $500', emoji: '💵' },
        { valor: 200, nombre: 'Billete $200', emoji: '💵' },
        { valor: 100, nombre: 'Billete $100', emoji: '💵' },
        { valor: 50, nombre: 'Billete $50', emoji: '💵' },
        { valor: 20, nombre: 'Billete $20', emoji: '💵' },
        { valor: 10, nombre: 'Moneda $10', emoji: '🪙' },
        { valor: 5, nombre: 'Moneda $5', emoji: '🪙' },
        { valor: 2, nombre: 'Moneda $2', emoji: '🪙' },
        { valor: 1, nombre: 'Moneda $1', emoji: '🪙' },
        { valor: 0.5, nombre: 'Moneda $0.50', emoji: '🪙' },
        { valor: 0.2, nombre: 'Moneda $0.20', emoji: '🪙' },
        { valor: 0.1, nombre: 'Moneda $0.10', emoji: '🪙' }
    ];
    
    let cambioRestante = cambio;
    let desgloseHTML = '<small>Desglose sugerido:</small><div class="lista-desglose">';
    
    for (const denom of denominaciones) {
        if (cambioRestante >= denom.valor) {
            const cantidad = Math.floor(cambioRestante / denom.valor);
            cambioRestante = Math.round((cambioRestante - (cantidad * denom.valor)) * 100) / 100;
            
            desgloseHTML += `
                <div class="item-desglose">
                    <span class="denom-emoji">${denom.emoji}</span>
                    <span class="denom-cantidad">${cantidad} x</span>
                    <span class="denom-valor">$${denom.valor.toFixed(2)}</span>
                </div>
            `;
        }
        
        if (cambioRestante === 0) break;
    }
    
    // Si queda algún residuo (por redondeo)
    if (cambioRestante > 0) {
        desgloseHTML += `
            <div class="item-desglose">
                <span class="denom-emoji'>🪙</span>
                <span class="denom-cantidad">1 x</span>
                <span class="denom-valor">$${cambioRestante.toFixed(2)}</span>
            </div>
        `;
    }
    
    desgloseHTML += '</div>';
    return desgloseHTML;
}

// 📋 REEMPLAZA LA FUNCIÓN confirmarPago() COMPLETAMENTE CON ESTA VERSIÓN CORREGIDA:

// 📋 REEMPLAZA LA FUNCIÓN confirmarPago() COMPLETAMENTE CON ESTA VERSIÓN SIMPLIFICADA:
async function confirmarPago(total) {
    console.log('🎯 confirmarPago() INICIADA - Total:', total);
    
    // 1. Verificar que hay productos en el carrito
    if (!window.carritoCobro || window.carritoCobro.length === 0) {
        alert('❌ El carrito está vacío');
        return;
    }
    
    // 2. Obtener método de pago seleccionado
    const metodoSeleccionado = document.querySelector('.metodo-pago-item.seleccionado');
    if (!metodoSeleccionado) {
        alert('❌ Selecciona un método de pago');
        return;
    }
    
    const metodo = metodoSeleccionado.getAttribute('data-metodo');
    console.log('💳 Método seleccionado:', metodo);
    
    // 3. Preparar datos según el método de pago
    let montoRecibido = total;
    let cambio = 0;
    let referencia = null;
    
    if (metodo === 'efectivo') {
        const montoInput = document.getElementById('montoRecibido');
        if (montoInput) {
            montoRecibido = parseFloat(montoInput.value) || total;
            cambio = montoRecibido - total;
            
            if (cambio < 0) {
                alert(`❌ Pago insuficiente. Faltan: $${Math.abs(cambio).toFixed(2)}`);
                return;
            }
        }
    } else {
        // Para métodos no-efectivo, obtener referencia si existe
        const referenciaInput = document.getElementById('referenciaPago');
        if (referenciaInput) {
            referencia = referenciaInput.value.trim() || null;
        }
    }
    
    // 4. Preparar datos de la venta
    // 4. Preparar datos de la venta (CORREGIDO)
    const ventaData = {
        total: total,
        productos: window.carritoCobro.map(item => ({
            id: item.id,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            control_inventario: item.control_inventario
        })),
        pago_recibido: montoRecibido,
        cambio: cambio,
        metodo_pago: metodo,
        referencia_pago: referencia || null  // Asegurar que sea null si está vacío
    };
    
    console.log('📤 Datos a enviar:', ventaData);
    
    // 5. Cerrar modal
    cerrarModalPago();
    
    // 6. Mostrar mensaje de procesamiento
    mostrarMensajeCobro('⏳ Procesando venta...', 'info');
    
    // 7. Enviar a la API
    try {
        const response = await fetch('/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventaData)
        });
        
        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);
        
        if (response.ok) {
            // ✅ ÉXITO - Limpiar carrito y mostrar mensaje
            window.carritoCobro = [];
            actualizarCarritoCobro();
            
            // Mostrar mensaje de éxito con detalles
            let mensajeExito = `✅ Venta registrada exitosamente`;
            if (data.id) {
                mensajeExito += ` (ID: #${data.id})`;
            }
            if (cambio > 0) {
                mensajeExito += ` - Cambio: $${cambio.toFixed(2)}`;
            }
            
            mostrarMensajeCobro(mensajeExito, 'success');
            
            // Opcional: Mostrar alerta con más detalles
            setTimeout(() => {
                alert(`🎉 Venta completada!\n\nTotal: $${total.toFixed(2)}\nMétodo: ${metodo}\n${cambio > 0 ? `Cambio: $${cambio.toFixed(2)}` : 'Pago exacto'}`);
            }, 500);
            
        } else {
            // ❌ ERROR DEL SERVIDOR
            console.error('Error del servidor:', data);
            mostrarMensajeCobro(`❌ Error: ${data.error || 'Error desconocido'}`, 'error');
            
            // Re-abrir el modal en caso de error
            setTimeout(() => {
                finalizarCuenta();
            }, 1000);
        }
        
    } catch (error) {
        // ❌ ERROR DE CONEXIÓN
        console.error('❌ Error de conexión:', error);
        mostrarMensajeCobro('❌ Error de conexión con el servidor', 'error');
    }
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
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="cobro-container">
            <!-- Panel izquierdo: Categorías y Búsqueda -->
            <div class="cobro-sidebar">
                <div class="busqueda-container">
                    <h3>🔍 Buscar Producto</h3>
                    <input type="text" id="buscar-cobro" placeholder="Código de barras o nombre..." 
                           autocomplete="off">
                    <button onclick="buscarProductoCobro()">Buscar</button>
                    <!-- Aquí se mostrarán los resultados predictivos -->
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
    
    // 🚀 INICIALIZAR BÚSQUEDA PREDICTIVA
    setTimeout(() => {
        inicializarBusquedaPredictiva();
    }, 100);
    
    // Actualizar carrito (se mostrará vacío)
    actualizarCarritoCobro();
}

// 🔧 ATAJOS DE TECLADO PARA COBRO - AGREGAR AL INICIO DEL MÓDULO
function inicializarAtajosTeclado() {
    document.addEventListener('keydown', function(e) {
        // Solo activar en módulo de cobro
        if (!document.querySelector('.cobro-container')) return;
        
        // Ctrl + Enter = Finalizar venta
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            finalizarCuenta();
        }
        
        // Ctrl + Delete = Cancelar venta
        if (e.ctrlKey && e.key === 'Delete') {
            e.preventDefault();
            cancelarCuenta();
        }
        
        // Ctrl + B = Enfocar búsqueda
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            const buscarInput = document.getElementById('buscar-cobro');
            if (buscarInput) buscarInput.focus();
        }
        
        // Ctrl + L = Limpiar búsqueda
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            const buscarInput = document.getElementById('buscar-cobro');
            if (buscarInput) {
                buscarInput.value = '';
                buscarInput.focus();
            }
        }
        
        // Escape = Cerrar modal de pago
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalPagoOverlay');
            if (modal) cerrarModalPago();
        }
        
        // F1 = Ayuda de atajos
        if (e.key === 'F1') {
            e.preventDefault();
            mostrarAyudaAtajos();
        }
    });
}

// 🆘 FUNCIÓN DE AYUDA PARA ATAJOS
function mostrarAyudaAtajos() {
    const ayudaHTML = `
        <div class="modal-pago-overlay" id="ayudaAtajosOverlay">
            <div class="modal-pago" style="max-width: 500px;">
                <h3>⌨️ Atajos de Teclado - Cobro Rápido</h3>
                <div class="atajos-lista">
                    <div class="atajo-item">
                        <span class="atajo-tecla">Ctrl + Enter</span>
                        <span class="atajo-descripcion">Finalizar venta</span>
                    </div>
                    <div class="atajo-item">
                        <span class="atajo-tecla">Ctrl + Delete</span>
                        <span class="atajo-descripcion">Cancelar venta</span>
                    </div>
                    <div class="atajo-item">
                        <span class="atajo-tecla">Ctrl + B</span>
                        <span class="atajo-descripcion">Buscar producto</span>
                    </div>
                    <div class="atajo-item">
                        <span class="atajo-tecla">Ctrl + L</span>
                        <span class="atajo-descripcion">Limpiar búsqueda</span>
                    </div>
                    <div class="atajo-item">
                        <span class="atajo-tecla">Escape</span>
                        <span class="atajo-descripcion">Cerrar modal</span>
                    </div>
                    <div class="atajo-item">
                        <span class="atajo-tecla">F1</span>
                        <span class="atajo-descripcion">Mostrar esta ayuda</span>
                    </div>
                </div>
                <div class="pago-botones">
                    <button onclick="document.getElementById('ayudaAtajosOverlay').remove()">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', ayudaHTML);
}

// 🔧 SISTEMA DE BÚSQUEDA PREDICTIVA

// Cache para productos (mejor performance)
let cacheBusquedaPredictiva = null;
let ultimaBusqueda = '';

// Función para inicializar búsqueda predictiva
function inicializarBusquedaPredictiva() {
    const buscarInput = document.getElementById('buscar-cobro');
    if (!buscarInput) return;
    
    // Limpiar cache cada 5 minutos
    setInterval(() => {
        cacheBusquedaPredictiva = null;
    }, 5 * 60 * 1000);
    
    // Evento de input para búsqueda en tiempo real
    buscarInput.addEventListener('input', function(e) {
        const termino = e.target.value.trim();
        
        if (termino.length === 0) {
            ocultarResultadosBusqueda();
            return;
        }
        
        if (termino.length >= 2) {
            buscarPredictivo(termino);
        } else {
            ocultarResultadosBusqueda();
        }
    });
    
    // Evento para manejar teclas especiales
    buscarInput.addEventListener('keydown', function(e) {
        const resultados = document.getElementById('resultados-busqueda');
        
        if (e.key === 'ArrowDown' && resultados) {
            e.preventDefault();
            navegarResultados('abajo');
        } else if (e.key === 'ArrowUp' && resultados) {
            e.preventDefault();
            navegarResultados('arriba');
        } else if (e.key === 'Enter' && resultados) {
            e.preventDefault();
            seleccionarResultadoActivo();
        } else if (e.key === 'Escape') {
            ocultarResultadosBusqueda();
        }
    });
    
    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.busqueda-container')) {
            ocultarResultadosBusqueda();
        }
    });
}

// Función principal de búsqueda predictiva
async function buscarPredictivo(termino) {
    try {
        // Usar cache si está disponible
        let productos = cacheBusquedaPredictiva;
        
        if (!productos) {
            const response = await fetch('/api/productos');
            productos = await response.json();
            cacheBusquedaPredictiva = productos;
        }
        
        // Filtrar productos (búsqueda inteligente)
        const resultados = filtrarProductosInteligente(productos, termino);
        
        // Mostrar resultados
        mostrarResultadosBusqueda(resultados, termino);
        
    } catch (error) {
        console.error('Error en búsqueda predictiva:', error);
    }
}

// Función de filtrado inteligente
function filtrarProductosInteligente(productos, termino) {
    const terminoLower = termino.toLowerCase();
    const resultados = [];
    
    productos.forEach(producto => {
        let puntuacion = 0;
        
        // Búsqueda por código de barras exacto (máxima prioridad)
        if (producto.codigo_barras && producto.codigo_barras.toString() === termino) {
            puntuacion = 100;
        }
        // Búsqueda por código de barras parcial
        else if (producto.codigo_barras && producto.codigo_barras.toString().includes(termino)) {
            puntuacion = 90;
        }
        // Búsqueda por nombre exacto
        else if (producto.nombre.toLowerCase() === terminoLower) {
            puntuacion = 80;
        }
        // Búsqueda por inicio del nombre
        else if (producto.nombre.toLowerCase().startsWith(terminoLower)) {
            puntuacion = 70;
        }
        // Búsqueda por palabras dentro del nombre
        else if (producto.nombre.toLowerCase().includes(terminoLower)) {
            puntuacion = 60;
        }
        // Búsqueda por categoría
        else if (producto.categoria_nombre && producto.categoria_nombre.toLowerCase().includes(terminoLower)) {
            puntuacion = 40;
        }
        
        // Bonus por stock disponible
        if (producto.control_inventario && producto.stock > 0) {
            puntuacion += 5;
        }
        
        // Penalización por sin stock
        if (producto.control_inventario && producto.stock === 0) {
            puntuacion -= 50;
        }
        
        if (puntuacion > 0) {
            resultados.push({ ...producto, puntuacion });
        }
    });
    
    // Ordenar por puntuación y luego por nombre
    return resultados.sort((a, b) => {
        if (b.puntuacion !== a.puntuacion) {
            return b.puntuacion - a.puntuacion;
        }
        return a.nombre.localeCompare(b.nombre);
    }).slice(0, 8); // Limitar a 8 resultados
}

// Función para mostrar resultados de búsqueda
function mostrarResultadosBusqueda(resultados, termino) {
    let contenedor = document.getElementById('resultados-busqueda');
    
    // Crear contenedor si no existe
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'resultados-busqueda';
        contenedor.className = 'resultados-busqueda';
        document.querySelector('.busqueda-container').appendChild(contenedor);
    }
    
    if (resultados.length === 0) {
        contenedor.innerHTML = `
            <div class="resultado-item vacio">
                <div class="resultado-info">
                    <span>🔍 No se encontraron productos</span>
                    <small>Intenta con otro término de búsqueda</small>
                </div>
            </div>
        `;
    } else {
        contenedor.innerHTML = resultados.map((producto, index) => `
            <div class="resultado-item ${index === 0 ? 'activo' : ''} ${producto.control_inventario && producto.stock === 0 ? 'sin-stock' : ''}" 
                 data-producto-id="${producto.id}"
                 onclick="seleccionarProductoBusqueda(${producto.id})"
                 onmouseover="resaltarResultado(${index})">
                <div class="resultado-info">
                    <div class="resultado-nombre">${resaltarCoincidencias(producto.nombre, termino)}</div>
                    <div class="resultado-detalles">
                        <span class="resultado-precio">$${parseFloat(producto.precio).toFixed(2)}</span>
                        ${producto.codigo_barras ? `<span class="resultado-codigo">${producto.codigo_barras}</span>` : ''}
                        ${producto.control_inventario ? 
                            `<span class="resultado-stock ${producto.stock === 0 ? 'stock-cero' : producto.stock <= 5 ? 'stock-bajo' : ''}">
                                ${producto.stock === 0 ? '❌ Sin stock' : `${producto.stock} unidades`}
                            </span>` : 
                            '<span class="resultado-stock">📦 Sin control</span>'
                        }
                    </div>
                </div>
                <div class="resultado-accion">
                    <button class="btn-agregar-rapido" onclick="event.stopPropagation(); seleccionarProductoBusqueda(${producto.id})">
                        +
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    contenedor.style.display = 'block';
}

// Función para resaltar coincidencias en el texto
function resaltarCoincidencias(texto, termino) {
    if (!termino) return texto;
    
    const regex = new RegExp(`(${termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<mark>$1</mark>');
}

// Función para navegar resultados con teclado
function navegarResultados(direccion) {
    const resultados = document.querySelectorAll('.resultado-item:not(.vacio)');
    if (resultados.length === 0) return;
    
    let indexActivo = -1;
    
    // Encontrar el resultado activo actual
    resultados.forEach((resultado, index) => {
        if (resultado.classList.contains('activo')) {
            indexActivo = index;
        }
        resultado.classList.remove('activo');
    });
    
    // Calcular nuevo índice
    let nuevoIndex;
    if (direccion === 'abajo') {
        nuevoIndex = (indexActivo + 1) % resultados.length;
    } else {
        nuevoIndex = indexActivo <= 0 ? resultados.length - 1 : indexActivo - 1;
    }
    
    // Activar nuevo resultado
    resultados[nuevoIndex].classList.add('activo');
    resultados[nuevoIndex].scrollIntoView({ block: 'nearest' });
}

// Función para resaltar resultado al pasar mouse
function resaltarResultado(index) {
    const resultados = document.querySelectorAll('.resultado-item');
    resultados.forEach((resultado, i) => {
        resultado.classList.toggle('activo', i === index);
    });
}

// Función para seleccionar resultado activo
function seleccionarResultadoActivo() {
    const resultadoActivo = document.querySelector('.resultado-item.activo:not(.vacio)');
    if (resultadoActivo) {
        const productoId = resultadoActivo.getAttribute('data-producto-id');
        seleccionarProductoBusqueda(parseInt(productoId));
    }
}

// Función para seleccionar producto desde búsqueda
async function seleccionarProductoBusqueda(productoId) {
    await agregarAlCarritoCobro(productoId);
    ocultarResultadosBusqueda();
    
    // Limpiar campo de búsqueda
    const buscarInput = document.getElementById('buscar-cobro');
    if (buscarInput) {
        buscarInput.value = '';
        buscarInput.focus();
    }
}

// Función para ocultar resultados
function ocultarResultadosBusqueda() {
    const contenedor = document.getElementById('resultados-busqueda');
    if (contenedor) {
        contenedor.style.display = 'none';
    }
}

//************************************************************************************************************************* */
//-----------------------------------------------USUARIOS----------------------------------------------------------------
//************************************************************************************************************************* */

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

//************************************************************************************************************************* */
//-----------------------------------------------REPORTES----------------------------------------------------------------
//************************************************************************************************************************* */

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
                    <label>📅 Fecha:</label>
                    <input type="date" id="fecha-ventas" value="${obtenerFechaHoy()}">
                </div>
                <div class="filtro-group">
                    <label>👤 Usuario:</label>
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
    
    // ✅ CARGAR VENTAS DEL DÍA AUTOMÁTICAMENTE
    setTimeout(() => {
        cargarVentasHoy();
    }, 100);
}

// 🗓️ FUNCIONES UTILITARIAS PARA FECHAS
// VERSIÓN CORREGIDA - HORARIO MÉXICO
function obtenerFechaHoy() {
    const hoy = new Date();
    // Ajustar a horario de México (UTC-6)
    const offsetMexico = -6 * 60 * 60 * 1000; // UTC-6 en milisegundos
    const fechaMexico = new Date(hoy.getTime() + offsetMexico);
    return fechaMexico.toISOString().split('T')[0];
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
    const fechaInput = document.getElementById('fecha-ventas').value;
    const usuarioId = document.getElementById('usuario-ventas').value;
    
    // ✅ USAR FECHA ACTUAL SI NO HAY SELECCIÓN
    const fecha = fechaInput || obtenerFechaHoy();
    
    console.log('🔍 Aplicando filtros:', { fecha, usuarioId });
    
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

    // ✅ CORREGIR: Usar función de formateo profesional
    let fechaDisplay = fecha;
    if (fecha) {
        const fechaObj = new Date(fecha + 'T00:00:00-06:00');
        fechaDisplay = fechaObj.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Mexico_City'
        });
    }
    
    let html = `
        <div class="lista-ventas-container">
            <div class="ventas-header-with-back">
                <h3>📋 ${fecha ? `Ventas del ${fechaDisplay}` : 'Todas las Ventas'}</h3>
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
            const fechaVenta = venta.fecha_formateada || 'Fecha no disponible';
            
            // 🆕 ICONO Y TEXTO DEL MÉTODO DE PAGO
            const metodoPagoInfo = obtenerInfoMetodoPago(venta.metodo_pago);
            
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
                    <div class="venta-detalles">
                        <div class="venta-metodo-pago ${metodoPagoInfo.clase}">
                            <span class="metodo-icon">${metodoPagoInfo.icono}</span>
                            <span class="metodo-texto">${metodoPagoInfo.texto}</span>
                            ${venta.referencia_pago ? `<small class="referencia">Ref: ${venta.referencia_pago}</small>` : ''}
                        </div>
                        <div class="venta-productos">
                            ${venta.productos_vendidos.map(p => 
                                `${p.cantidad}x ${p.nombre}`
                            ).join(', ')}
                        </div>
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

// 🆕 FUNCIÓN MEJORADA PARA OBTENER INFORMACIÓN DEL MÉTODO DE PAGO
// 🆕 FUNCIÓN CORREGIDA - MANEJA NULL EXPLÍCITAMENTE
function obtenerInfoMetodoPago(metodo) {
    // ✅ MEJOR DEPURACIÓN
    console.log('🔍 Método de pago recibido:', metodo, 'Tipo:', typeof metodo);
    
    // Si es null/undefined o string vacío
    if (!metodo || metodo === 'null' || metodo === 'undefined') {
        console.warn('⚠️ Método de pago no definido, usando "efectivo"');
        return {
            icono: '💵',
            texto: 'Efectivo que no es efectivo',
            clase: 'metodo-efectivo'
        };
    }
    
    // Convertir a string y limpiar
    const metodoNormalizado = String(metodo).toLowerCase().trim();
    console.log('🔧 Método normalizado:', metodoNormalizado);
    
    const metodos = {
        'efectivo': { icono: '💵', texto: 'Efectivo', clase: 'metodo-efectivo' },
        'tarjeta_credito': { icono: '💳', texto: 'Tarjeta Crédito', clase: 'metodo-tarjeta' },
        'tarjeta_debito': { icono: '🏦', texto: 'Tarjeta Débito', clase: 'metodo-tarjeta' },
        'tarjeta_digital': { icono: '📱', texto: 'Tarjeta Digital', clase: 'metodo-digital' },
        'transferencia': { icono: '🔄', texto: 'Transferencia', clase: 'metodo-transferencia' },
        'cheque': { icono: '📄', texto: 'Cheque', clase: 'metodo-cheque' }
    };
    
    const infoMetodo = metodos[metodoNormalizado];
    
    if (infoMetodo) {
        return infoMetodo;
    } else {
        console.warn(`❌ Método no reconocido: "${metodoNormalizado}"`);
        // Si no se reconoce, mostrar el valor original
        return {
            icono: '❓',
            texto: metodoNormalizado || 'Desconocido',
            clase: 'metodo-desconocido'
        };
    }
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
        
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        
        const data = await response.json();
        
        // ✅ VALIDACIÓN EXTRA PARA DATOS CORRUPTOS
        if (!data) {
            throw new Error('No se recibieron datos del servidor');
        }
        
        mostrarReporteTendencias(data, dias);
        
    } catch (error) {
        console.error('❌ Error en reporte tendencias:', error);
        
        // ✅ MOSTRAR MENSAJE DE ERROR AMIGABLE
        const contenido = document.getElementById('contenido-ventas');
        contenido.innerHTML = `
            <div class="reporte-container">
                <div class="reporte-header">
                    <h3>📈 Tendencias de Ventas</h3><br>
                    <button class="btn-volver-menu" onclick="mostrarReportesAvanzados()">← Volver a Reportes</button>
                </div>
                <div class="error-message">
                    <h4>⚠️ No se pudieron cargar las tendencias</h4>
                    <p>${error.message}</p>
                    <small>Intenta nuevamente o verifica que hayan ventas registradas en el periodo.</small>
                </div>
            </div>
        `;
    }
}

function mostrarReporteTendencias(data, dias) {
    const contenido = document.getElementById('contenido-ventas');
    
    // ✅ VALIDACIONES SEGURAS PARA EVITAR ERRORES
    const totalPeriodo = data.total_periodo || 0;
    const promedioDiario = data.promedio_diario || 0;
    const mejorDia = data.mejor_dia || { total: 0, fecha: '' };
    const tendencias = data.tendencias || [];
    
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
                    <strong>$${promedioDiario.toFixed(2)}</strong>
                </div>
                <div class="tendencia-stat">
                    <span>Mejor Día:</span>
                    <strong>$${(mejorDia.total || 0).toFixed(2)}</strong>
                    <small>${mejorDia.fecha ? formatearFecha(mejorDia.fecha) : 'Sin datos'}</small>
                </div>
                <div class="tendencia-stat">
                    <span>Total Periodo:</span>
                    <strong>$${totalPeriodo.toFixed(2)}</strong>
                </div>
            </div>
            
            <div class="tendencias-lista">
                <h4>📅 Ventas por Día</h4>
    `;
    
    if (tendencias.length === 0) {
        html += `
            <div class="no-data">
                <p>📊 No hay datos de ventas para mostrar en este periodo</p>
                <small>Las ventas aparecerán aquí una vez que se realicen transacciones</small>
            </div>
        `;
    } else {
        tendencias.forEach(tendencia => {
            // ✅ VALIDACIÓN SEGURA PARA CADA TENDENCIA
            const fecha = tendencia.fecha || '';
            const total = tendencia.total || 0;
            const cantidadVentas = tendencia.cantidad_ventas || 0;
            
            html += `
                <div class="tendencia-item">
                    <div class="tendencia-fecha">${fecha ? formatearFecha(fecha) : 'Fecha no disponible'}</div>
                    <div class="tendencia-monto">$${total.toFixed(2)}</div>
                    <div class="tendencia-ventas">${cantidadVentas} ventas</div>
                </div>
            `;
        });
    }
    
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

// 🚨 SISTEMA DE ALERTAS DE STOCK BAJO

// Función para verificar stock bajo periódicamente
let intervaloStock = null;

function iniciarMonitoreoStock() {
    // Verificar stock cada 2 minutos
    intervaloStock = setInterval(verificarStockBajo, 2 * 60 * 1000);
    
    // Verificar inmediatamente al cargar
    setTimeout(verificarStockBajo, 2000);
}

// Función principal para verificar stock bajo
async function verificarStockBajo() {
    try {
        const response = await fetch('/api/productos/stock-bajo?limite=20');
        const productosStockBajo = await response.json();
        
        const statsResponse = await fetch('/api/productos/estadisticas-stock');
        const estadisticas = await statsResponse.json();
        
        mostrarAlertasStock(productosStockBajo, estadisticas);
        
    } catch (error) {
        console.error('Error verificando stock:', error);
    }
}

// Función para mostrar las alertas
function mostrarAlertasStock(productos, estadisticas) {
    // Limpiar alertas anteriores
    const alertaExistente = document.getElementById('alerta-stock-global');
    if (alertaExistente) {
        alertaExistente.remove();
    }
    
    // Si no hay productos con stock bajo, no mostrar nada
    if (!productos || productos.length === 0) {
        return;
    }
    
    // Crear alerta global
    const alertaHTML = crearAlertaStockHTML(productos, estadisticas);
    document.body.insertAdjacentHTML('afterbegin', alertaHTML);
    
    // Configurar eventos de la alerta
    configurarEventosAlertaStock();
}

// Función para crear el HTML de la alerta
function crearAlertaStockHTML(productos, estadisticas) {
    const productosCriticos = productos.filter(p => p.stock <= 5);
    const productosBajos = productos.filter(p => p.stock > 5 && p.stock <= 10);
    
    return `
        <div class="alerta-stock-global" id="alerta-stock-global">
            <div class="alerta-stock-header">
                <h4>📦 Alertas de Stock</h4>
                <button class="btn-cerrar-alerta" onclick="cerrarAlertaStock()">×</button>
            </div>
            
            <div class="alerta-stock-stats">
                <div class="stat-item ${productosCriticos.length > 0 ? 'critico' : ''}">
                    <span>Crítico (≤5):</span>
                    <strong>${productosCriticos.length}</strong>
                </div>
                <div class="stat-item ${productosBajos.length > 0 ? 'bajo' : ''}">
                    <span>Bajo (6-10):</span>
                    <strong>${productosBajos.length}</strong>
                </div>
                <div class="stat-item total">
                    <span>Total alertas:</span>
                    <strong>${productos.length}</strong>
                </div>
            </div>
            
            <div class="alerta-stock-lista">
                ${productos.map(producto => `
                    <div class="producto-alerta ${producto.stock <= 5 ? 'critico' : 'bajo'}">
                        <div class="producto-info">
                            <strong>${producto.nombre}</strong>
                            <span class="stock-cantidad ${producto.stock <= 2 ? 'urgente' : ''}">
                                ${producto.stock} unidades
                            </span>
                        </div>
                        <div class="producto-acciones">
                            <button class="btn-rapido-stock" onclick="cargarGestionProductos()">
                                Reabastecer
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="alerta-stock-footer">
                <small>Última verificación: ${new Date().toLocaleTimeString()}</small>
                <button class="btn-ver-todos" onclick="cargarGestionProductos()">
                    Ver todos los productos
                </button>
            </div>
        </div>
    `;
}

// Función para cargar gestión de productos
function cargarGestionProductos() {
    if (typeof showSection === 'function') {
        showSection('productos');
    }
    cerrarAlertaStock();
}

// Función para cerrar la alerta
function cerrarAlertaStock() {
    const alerta = document.getElementById('alerta-stock-global');
    if (alerta) {
        alerta.remove();
    }
}

// Configurar eventos de la alerta
function configurarEventosAlertaStock() {
    // Cerrar alerta al hacer clic fuera de ella
    document.addEventListener('click', function(e) {
        const alerta = document.getElementById('alerta-stock-global');
        if (alerta && !alerta.contains(e.target)) {
            cerrarAlertaStock();
        }
    });
    
    // Prevenir que el clic dentro de la alerta la cierre
    const alerta = document.getElementById('alerta-stock-global');
    if (alerta) {
        alerta.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

// 🎯 ACTUALIZA LA FUNCIÓN loadApp PARA INICIAR EL MONITOREO:
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
        
        // 🚨 INICIAR MONITOREO DE STOCK PARA ADMIN
        setTimeout(() => {
            iniciarMonitoreoStock();
        }, 1000);
        
    } else {
        // Vista para cajero...
        // (Los cajeros no necesitan alertas de stock)
    }
}

// 📊 AGREGAR INDICADOR DE STOCK EN EL MÓDULO DE PRODUCTOS
async function cargarListaProductos() {
    try {
        const response = await fetch('/api/productos');
        const productos = await response.json();
        
        // Guardar productos globalmente para filtrado
        window.todosProductos = productos;
        
        mostrarProductosEnLista(productos);
        
        // 🚨 VERIFICAR STOCK BAJO AL CARGAR PRODUCTOS
        if (window.todosProductos) {
            const productosStockBajo = window.todosProductos.filter(p => 
                p.control_inventario && p.stock <= 10
            );
            
            if (productosStockBajo.length > 0) {
                mostrarMensajeProductos(
                    `⚠️ ${productosStockBajo.length} productos con stock bajo`, 
                    'warning'
                );
            }
        }
        
    } catch (error) {
        mostrarMensajeProductos('Error cargando productos', 'error');
    }
}

// 🎨 MEJORAR LA VISUALIZACIÓN DE STOCK EN LA LISTA
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
        
        // 🚨 INDICADOR VISUAL DE STOCK
        let stockHTML = '';
        if (producto.control_inventario) {
            let stockClass = 'stock-normal';
            let stockIcon = '📦';
            
            if (producto.stock === 0) {
                stockClass = 'stock-agotado';
                stockIcon = '❌';
            } else if (producto.stock <= 2) {
                stockClass = 'stock-critico';
                stockIcon = '🚨';
            } else if (producto.stock <= 5) {
                stockClass = 'stock-bajo';
                stockIcon = '⚠️';
            } else if (producto.stock <= 10) {
                stockClass = 'stock-medio';
                stockIcon = '📉';
            }
            
            stockHTML = `<p class="${stockClass}"><strong>Stock:</strong> ${stockIcon} ${producto.stock} unidades</p>`;
        } else {
            stockHTML = `<p><strong>Inventario:</strong> <span class="sin-inventario">No se controla</span></p>`;
        }
        
        productoDiv.innerHTML = `
            <div class="card-content">
                <h4>${producto.nombre}</h4>
                ${producto.codigo_barras ? `<p><strong>Código:</strong> ${producto.codigo_barras}</p>` : ''}
                <p><strong>Precio:</strong> $${parseFloat(producto.precio).toFixed(2)}</p>
                ${stockHTML}
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
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'pos-tienda-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Crear carpeta database si no existe
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Configurar base de datos
const dbPath = path.join(dbDir, 'tienda.db');
const db = new sqlite3.Database(dbPath);

// ✅ CONFIGURACIÓN PROFESIONAL: Establecer timezone local
db.configure("busyTimeout", 3000);
db.exec("PRAGMA foreign_keys = ON;", (err) => {
    if (err) console.error('Error configurando foreign keys:', err);
});

// Configurar timezone para México
db.exec("PRAGMA timezone = '-06:00';", (err) => {
    if (err) {
        console.log('⚠️ SQLite no soporta PRAGMA timezone, usando solución alternativa');
    } else {
        console.log('✅ Timezone configurado: America/Mexico_City (UTC-6)');
    }
});

// Crear tablas iniciales
db.serialize(() => {
    // Tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        tipo TEXT NOT NULL DEFAULT 'cajero'
    )`);
    
    // Tabla de categorías
    db.run(`CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL
    )`);
    
    // Tabla de productos
    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_barras TEXT UNIQUE,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        categoria_id INTEGER,
        stock INTEGER DEFAULT 0,
        control_inventario BOOLEAN DEFAULT 1,
        FOREIGN KEY (categoria_id) REFERENCES categorias (id)
    )`);
    
    // En la creación de la tabla ventas, agrega:
    db.run(`CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        total REAL NOT NULL,
        usuario_id INTEGER,
        productos_vendidos TEXT,
        pago_recibido REAL,        -- NUEVO: Monto recibido del cliente
        cambio REAL,               -- NUEVO: Cambio entregado
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )`);

    // Crear usuario administrador por defecto
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO usuarios (username, password, tipo) VALUES (?, ?, ?)`, 
        ['admin', passwordHash, 'administrador']);
});

// 🕐 FUNCIONES PROFESIONALES PARA MANEJO DE FECHAS

/**
 * Obtiene la fecha/hora actual en formato ISO para SQLite
 * @returns {string} Fecha en formato YYYY-MM-DD HH:MM:SS
 */
 function obtenerFechaHoraSQLite() {
    const ahora = new Date();
    // Ajustar a horario de México (UTC-6)
    const offsetMexico = -6 * 60 * 60 * 1000; // UTC-6 en milisegundos
    const fechaMexico = new Date(ahora.getTime() + offsetMexico);
    
    return fechaMexico.toISOString()
        .replace('T', ' ')
        .replace(/\.\d{3}Z$/, '');
}

/**
 * Formatea una fecha ISO a formato legible en español
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string} Fecha formateada en español
 */
function formatearFechaEspanol(fechaISO) {
    const fecha = new Date(fechaISO);
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Mexico_City'
    };
    
    return fecha.toLocaleDateString('es-MX', opciones);
}

/**
 * Formatea fecha para mostrar en listas (más compacto)
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string} Fecha formateada compacta
 */
function formatearFechaCompacta(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Mexico_City'
    });
}


// VERIFICAR Y AGREGAR COLUMNA SI ES NECESARIO
db.all("PRAGMA table_info(productos)", (err, rows) => {
    if (err) {
        console.log('❌ Error verificando estructura de tabla:', err.message);
        return;
    }

    // rows ES un array, podemos usar some() ahora
    const hasControlInventario = rows.some(row => row.name === 'control_inventario');

    if (!hasControlInventario) {
        db.run("ALTER TABLE productos ADD COLUMN control_inventario BOOLEAN DEFAULT 1", (err) => {
            if (err) {
                console.log('❌ Error agregando columna control_inventario:', err.message);
            } else {
                console.log('✅ Columna control_inventario agregada a productos');
            }
        });
    } else {
        console.log('✅ Columna control_inventario ya existe en productos');
    }
});

// ACTUALIZAR TABLA VENTAS SI FALTAN COLUMNAS
db.all("PRAGMA table_info(ventas)", (err, rows) => {
    if (err) {
        console.log('❌ Error verificando estructura de ventas:', err.message);
        return;
    }

    const columnasExistentes = rows.map(row => row.name);
    console.log('📋 Columnas existentes en ventas:', columnasExistentes);

    // Columnas que necesitamos
    const columnasNecesarias = ['pago_recibido', 'cambio'];
    const columnasFaltantes = columnasNecesarias.filter(col => !columnasExistentes.includes(col));

    if (columnasFaltantes.length > 0) {
        console.log('🔄 Agregando columnas faltantes:', columnasFaltantes);
        
        columnasFaltantes.forEach(columna => {
            let tipoDato = 'REAL';
            if (columna === 'pago_recibido') tipoDato = 'REAL';
            if (columna === 'cambio') tipoDato = 'REAL';
            
            db.run(`ALTER TABLE ventas ADD COLUMN ${columna} ${tipoDato}`, (err) => {
                if (err) {
                    console.log(`❌ Error agregando columna ${columna}:`, err.message);
                } else {
                    console.log(`✅ Columna ${columna} agregada a ventas`);
                }
            });
        });
    } else {
        console.log('✅ Todas las columnas necesarias existen en ventas');
    }
});

// Middleware para verificar autenticación
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'No autenticado' });
    }
}

// Middleware para verificar si es administrador
function requireAdmin(req, res, next) {
    if (req.session.user && req.session.user.tipo === 'administrador') {
        next();
    } else {
        res.status(403).json({ error: 'Se requiere permisos de administrador' });
    }
}

// RUTAS DE AUTENTICACIÓN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get("SELECT * FROM usuarios WHERE username = ?", [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.user = {
                id: user.id,
                username: user.username,
                tipo: user.tipo
            };
            res.json({ 
                success: true, 
                user: req.session.user 
            });
        } else {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Ruta principal - redirige al login o dashboard según autenticación
app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// Ruta de login directa
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta para obtener información del usuario actual
app.get('/api/user', (req, res) => {
    res.json({ user: req.session.user || null });
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: '✅ Servidor POS Tienda funcionando' });
});


// 📁 RUTAS PARA CATEGORÍAS
app.get('/api/categorias', requireAuth, (req, res) => {
    db.all("SELECT * FROM categorias ORDER BY nombre", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/categorias', requireAuth, requireAdmin, (req, res) => {
    const { nombre } = req.body;
    
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    db.run("INSERT INTO categorias (nombre) VALUES (?)", [nombre], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        res.json({ id: this.lastID, mensaje: 'Categoría creada correctamente' });
    });
});

app.put('/api/categorias/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    db.run("UPDATE categorias SET nombre = ? WHERE id = ?", [nombre, id], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Categoría no encontrada' });
            return;
        }
        
        res.json({ mensaje: 'Categoría actualizada correctamente' });
    });
});

app.delete('/api/categorias/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    
    // Verificar si hay productos usando esta categoría
    db.get("SELECT COUNT(*) as count FROM productos WHERE categoria_id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row.count > 0) {
            res.status(400).json({ error: 'No se puede eliminar la categoría porque tiene productos asociados' });
            return;
        }
        
        db.run("DELETE FROM categorias WHERE id = ?", [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                res.status(404).json({ error: 'Categoría no encontrada' });
                return;
            }
            
            res.json({ mensaje: 'Categoría eliminada correctamente' });
        });
    });
});

// 👥 RUTAS PARA USUARIOS
app.get('/api/usuarios', requireAuth, requireAdmin, (req, res) => {
    db.all("SELECT id, username, tipo FROM usuarios ORDER BY username", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/usuarios', requireAuth, requireAdmin, (req, res) => {
    const { username, password, tipo } = req.body;
    
    if (!username || !password || !tipo) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    const passwordHash = bcrypt.hashSync(password, 10);
    
    db.run("INSERT INTO usuarios (username, password, tipo) VALUES (?, ?, ?)", 
        [username, passwordHash, tipo], 
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Ya existe un usuario con ese nombre' });
                } else {
                    res.status(500).json({ error: err.message });
                }
                return;
            }
            res.json({ id: this.lastID, mensaje: 'Usuario creado correctamente' });
        }
    );
});

app.put('/api/usuarios/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { username, password, tipo } = req.body;
    
    if (!username || !tipo) {
        return res.status(400).json({ error: 'Usuario y tipo son requeridos' });
    }
    
    let query, params;
    
    if (password) {
        // Si se proporciona password, actualizar todo
        const passwordHash = bcrypt.hashSync(password, 10);
        query = "UPDATE usuarios SET username = ?, password = ?, tipo = ? WHERE id = ?";
        params = [username, passwordHash, tipo, id];
    } else {
        // Si no se proporciona password, mantener el actual
        query = "UPDATE usuarios SET username = ?, tipo = ? WHERE id = ?";
        params = [username, tipo, id];
    }
    
    db.run(query, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Ya existe un usuario con ese nombre' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        
        res.json({ mensaje: 'Usuario actualizado correctamente' });
    });
});

app.delete('/api/usuarios/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    
    // Prevenir eliminar al usuario admin principal
    db.get("SELECT username FROM usuarios WHERE id = ?", [id], (err, user) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (user && user.username === 'admin') {
            res.status(400).json({ error: 'No se puede eliminar el usuario administrador principal' });
            return;
        }
        
        db.run("DELETE FROM usuarios WHERE id = ?", [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            
            res.json({ mensaje: 'Usuario eliminado correctamente' });
        });
    });
});

// 📦 RUTAS PARA PRODUCTOS - VERSIÓN CORREGIDA
app.get('/api/productos', requireAuth, (req, res) => {
    const query = `
        SELECT p.*, c.nombre as categoria_nombre 
        FROM productos p 
        LEFT JOIN categorias c ON p.categoria_id = c.id 
        ORDER BY p.nombre
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/productos', requireAuth, requireAdmin, (req, res) => {
    const { codigo_barras, nombre, precio, categoria_id, stock, control_inventario } = req.body;
    
    if (!nombre || !precio || stock === undefined) {
        return res.status(400).json({ error: 'Nombre, precio y stock son requeridos' });
    }
    
    // CORREGIDO: Sintaxis correcta
    db.run(`INSERT INTO productos (codigo_barras, nombre, precio, categoria_id, stock, control_inventario) VALUES (?, ?, ?, ?, ?, ?)`, 
        [codigo_barras || null, nombre, precio, categoria_id || null, stock, control_inventario ? 1 : 0], 
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Ya existe un producto con ese código de barras' });
                } else {
                    res.status(500).json({ error: err.message });
                }
                return;
            }
            res.json({ id: this.lastID, mensaje: 'Producto creado correctamente' });
        }
    );
});

app.put('/api/productos/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { codigo_barras, nombre, precio, categoria_id, stock, control_inventario } = req.body;
    
    if (!nombre || !precio || stock === undefined) {
        return res.status(400).json({ error: 'Nombre, precio y stock son requeridos' });
    }
    
    // CORREGIDO: Sintaxis correcta
    db.run(`UPDATE productos SET codigo_barras = ?, nombre = ?, precio = ?, categoria_id = ?, stock = ?, control_inventario = ? WHERE id = ?`, 
        [codigo_barras || null, nombre, precio, categoria_id || null, stock, control_inventario ? 1 : 0, id], 
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Ya existe un producto con ese código de barras' });
                } else {
                    res.status(500).json({ error: err.message });
                }
                return;
            }
            
            if (this.changes === 0) {
                res.status(404).json({ error: 'Producto no encontrado' });
                return;
            }
            
            res.json({ mensaje: 'Producto actualizado correctamente' });
        }
    );
});

app.delete('/api/productos/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    
    db.run("DELETE FROM productos WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }
        
        res.json({ mensaje: 'Producto eliminado correctamente' });
    });
});

// 🧾 RUTA PARA REGISTRAR VENTAS - VERSIÓN MEJORADA
app.post('/api/ventas', requireAuth, async (req, res) => {
    const { total, productos, pago_recibido, cambio } = req.body;
    const usuario_id = req.session.user.id;
    
    console.log('📝 Registrando venta - Usuario:', usuario_id, 'Total:', total);
    
    // Validaciones profesionales
    if (!total || total <= 0) {
        return res.status(400).json({ error: 'Total debe ser mayor a 0' });
    }
    
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: 'Lista de productos inválida' });
    }
    
    try {
        // Convertir productos a JSON string con validación
        const productosJSON = JSON.stringify(productos);
        const pago = pago_recibido || total;
        const cambioCalculado = cambio || 0;
        
        // ✅ USAR FUNCIÓN PROFESIONAL PARA FECHA
        const fechaVenta = obtenerFechaHoraSQLite();
        
        console.log('🕐 Fecha de venta registrada:', fechaVenta);
        
        // Registrar la venta
        db.run(
            "INSERT INTO ventas (fecha, total, usuario_id, productos_vendidos, pago_recibido, cambio) VALUES (?, ?, ?, ?, ?, ?)",
            [fechaVenta, total, usuario_id, productosJSON, pago, cambioCalculado],
            async function(err) {
                if (err) {
                    console.error('❌ Error registrando venta:', err);
                    res.status(500).json({ error: 'Error al registrar la venta: ' + err.message });
                    return;
                }
                
                const ventaId = this.lastID;
                console.log('✅ Venta registrada - ID:', ventaId, 'Fecha:', fechaVenta);
                
                // Actualizar stocks de productos (transacción segura)
                await actualizarStocksProductos(productos);
                
                res.json({ 
                    id: ventaId, 
                    mensaje: 'Venta registrada correctamente',
                    cambio: cambioCalculado,
                    fecha: fechaVenta
                });
            }
        );
        
    } catch (error) {
        console.error('❌ Error en proceso de venta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función profesional para actualizar stocks
async function actualizarStocksProductos(productos) {
    const promesas = productos.map(producto => {
        return new Promise((resolve, reject) => {
            if (producto.control_inventario) {
                db.run(
                    "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?",
                    [producto.cantidad, producto.id, producto.cantidad],
                    function(updateErr) {
                        if (updateErr) {
                            console.error('❌ Error actualizando stock:', updateErr);
                            reject(updateErr);
                        } else if (this.changes === 0) {
                            console.warn('⚠️ Stock insuficiente para producto:', producto.id);
                            resolve(); // No rechazamos la venta, solo log warning
                        } else {
                            console.log('✅ Stock actualizado - Producto:', producto.id);
                            resolve();
                        }
                    }
                );
            } else {
                resolve(); // Productos sin control de inventario
            }
        });
    });
    
    return Promise.allSettled(promesas);
}

// También agrega esta ruta para obtener ventas (la necesitaremos después)
// 🧾 RUTA ÚNICA PARA OBTENER VENTAS CON FILTROS
app.get('/api/ventas', requireAuth, (req, res) => {
    const { fecha, usuario_id, fecha_inicio, fecha_fin } = req.query;
    
    let query = `
        SELECT v.*, u.username as usuario_nombre 
        FROM ventas v 
        LEFT JOIN usuarios u ON v.usuario_id = u.id 
    `;
    let params = [];
    let conditions = [];
    
    // FILTRO POR FECHA ESPECÍFICA
    if (fecha) {
        conditions.push(`DATE(v.fecha) = ?`);
        params.push(fecha);
    }
    
    // FILTRO POR RANGO DE FECHAS
    if (fecha_inicio && fecha_fin) {
        conditions.push(`DATE(v.fecha) BETWEEN ? AND ?`);
        params.push(fecha_inicio, fecha_fin);
    }
    
    // FILTRO POR USUARIO
    if (usuario_id) {
        conditions.push(`v.usuario_id = ?`);
        params.push(usuario_id);
    }
    
    // CONSTRUIR QUERY FINAL
    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }
    
    query += ` ORDER BY v.fecha DESC`;
    
    console.log('📋 Consultando ventas con filtros:', { fecha, fecha_inicio, fecha_fin, usuario_id });
    console.log('🔍 Query:', query);
    console.log('📊 Params:', params);
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('❌ Error en consulta de ventas:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        console.log(`✅ Encontradas ${rows.length} ventas con los filtros aplicados`);
        
        // Parsear productos vendidos y formatear fechas
        const ventasConProductos = rows.map(venta => {
            try {
                venta.productos_vendidos = JSON.parse(venta.productos_vendidos);
            } catch (e) {
                console.error('Error parseando productos:', e);
                venta.productos_vendidos = [];
            }
            
            // Formatear fechas para mostrar
            venta.fecha_formateada = formatearFechaCompacta(venta.fecha);
            venta.fecha_completa = formatearFechaEspanol(venta.fecha);
            
            return venta;
        });
        
        res.json(ventasConProductos);
    });
});

// 📋 AGREGA ESTA RUTA EN LA SECCIÓN DE PRODUCTOS (después de las rutas existentes):

// 🚨 RUTA PARA OBTENER PRODUCTOS CON STOCK BAJO
app.get('/api/productos/stock-bajo', requireAuth, (req, res) => {
    const { limite = 10 } = req.query;
    
    const query = `
        SELECT p.*, c.nombre as categoria_nombre 
        FROM productos p 
        LEFT JOIN categorias c ON p.categoria_id = c.id 
        WHERE p.control_inventario = 1 
        AND p.stock <= 10 
        ORDER BY p.stock ASC 
        LIMIT ?
    `;
    
    db.all(query, [parseInt(limite)], (err, rows) => {
        if (err) {
            console.error('❌ Error obteniendo stock bajo:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 📊 RUTA PARA ESTADÍSTICAS DE STOCK
app.get('/api/productos/estadisticas-stock', requireAuth, (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_productos,
            SUM(CASE WHEN control_inventario = 1 THEN 1 ELSE 0 END) as con_inventario,
            SUM(CASE WHEN control_inventario = 1 AND stock <= 10 THEN 1 ELSE 0 END) as stock_bajo,
            SUM(CASE WHEN control_inventario = 1 AND stock <= 5 THEN 1 ELSE 0 END) as stock_critico,
            SUM(CASE WHEN control_inventario = 1 AND stock = 0 THEN 1 ELSE 0 END) as sin_stock
        FROM productos
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error('❌ Error estadísticas stock:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows[0] || {});
    });
});

// 🧾 RUTAS COMPLETAS PARA VENTAS Y REPORTES

// Ruta para obtener ventas con filtros
app.get('/api/ventas', requireAuth, (req, res) => {
    const { fecha, usuario_id, fecha_inicio, fecha_fin } = req.query;
    
    let query = `
        SELECT v.*, u.username as usuario_nombre 
        FROM ventas v 
        LEFT JOIN usuarios u ON v.usuario_id = u.id 
    `;
    let params = [];
    let whereAdded = false;
    
    if (fecha) {
        query += ` WHERE DATE(v.fecha) = ?`;
        params.push(fecha);
        whereAdded = true;
    }
    
    if (fecha_inicio && fecha_fin) {
        if (whereAdded) {
            query += ` AND DATE(v.fecha) BETWEEN ? AND ?`;
        } else {
            query += ` WHERE DATE(v.fecha) BETWEEN ? AND ?`;
            whereAdded = true;
        }
        params.push(fecha_inicio, fecha_fin);
    }
    
    if (usuario_id) {
        if (whereAdded) {
            query += ` AND v.usuario_id = ?`;
        } else {
            query += ` WHERE v.usuario_id = ?`;
        }
        params.push(usuario_id);
    }
    
    query += ` ORDER BY v.fecha DESC`;
    
    console.log('📋 Consultando ventas:', query, params);
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('❌ Error en consulta de ventas:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Parsear productos vendidos
        const ventasConProductos = rows.map(venta => {
            try {
                venta.productos_vendidos = JSON.parse(venta.productos_vendidos);
            } catch (e) {
                console.error('Error parseando productos:', e);
                venta.productos_vendidos = [];
            }
            return venta;
        });
        
        res.json(ventasConProductos);
    });
});

// 🎯 CORTE Z - Reporte por categorías
app.get('/api/ventas/corte', requireAuth, (req, res) => {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
    
    console.log('📊 Generando corte Z para fecha:', fechaConsulta);
    
    // Consulta para obtener ventas del día
    const queryVentas = `
        SELECT v.*, u.username as usuario_nombre 
        FROM ventas v 
        LEFT JOIN usuarios u ON v.usuario_id = u.id 
        WHERE DATE(v.fecha) = ?
        ORDER BY v.fecha
    `;
    
    db.all(queryVentas, [fechaConsulta], (err, ventas) => {
        if (err) {
            console.error('❌ Error en corte Z:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Procesar ventas para el corte
        procesarCorteZ(ventas, fechaConsulta, req.session.user, res);
    });
});

// Función para procesar el corte Z
function procesarCorteZ(ventas, fecha, usuario, res) {
    if (ventas.length === 0) {
        return res.json({
            fecha: fecha,
            totales: {
                general: {
                    total_ventas: 0,
                    total_ventas_cantidad: 0,
                    promedio_venta: 0
                },
                categorias: []
            },
            productos_mas_vendidos: [],
            usuario_actual: usuario
        });
    }
    
    // Calcular totales generales
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    const totalVentasCantidad = ventas.length;
    const promedioVenta = totalVentas / totalVentasCantidad;
    
    // Procesar productos por categoría
    const categoriasMap = new Map();
    const productosMap = new Map();
    
    ventas.forEach(venta => {
        try {
            const productos = JSON.parse(venta.productos_vendidos);
            
            productos.forEach(prod => {
                // Agrupar por categoría (por ahora general)
                const categoriaNombre = 'General';
                
                if (!categoriasMap.has(categoriaNombre)) {
                    categoriasMap.set(categoriaNombre, {
                        categoria_nombre: categoriaNombre,
                        total_ventas: 0,
                        monto_total: 0
                    });
                }
                
                const cat = categoriasMap.get(categoriaNombre);
                cat.total_ventas += 1;
                cat.monto_total += prod.precio * prod.cantidad;
                
                // Agrupar productos más vendidos
                if (!productosMap.has(prod.nombre)) {
                    productosMap.set(prod.nombre, {
                        nombre: prod.nombre,
                        total_vendido: 0,
                        monto_total: 0
                    });
                }
                
                const producto = productosMap.get(prod.nombre);
                producto.total_vendido += prod.cantidad;
                producto.monto_total += prod.precio * prod.cantidad;
            });
            
        } catch (error) {
            console.error('Error procesando productos de venta:', error);
        }
    });
    
    // Convertir mapas a arrays y calcular porcentajes
    const categoriasArray = Array.from(categoriasMap.values());
    categoriasArray.forEach(cat => {
        cat.porcentaje = totalVentas > 0 ? ((cat.monto_total / totalVentas) * 100).toFixed(1) : '0.0';
    });
    
    // Ordenar productos más vendidos
    const productosArray = Array.from(productosMap.values())
        .sort((a, b) => b.total_vendido - a.total_vendido)
        .slice(0, 10);
    
    res.json({
        fecha: fecha,
        totales: {
            general: {
                total_ventas: totalVentas,
                total_ventas_cantidad: totalVentasCantidad,
                promedio_venta: promedioVenta
            },
            categorias: categoriasArray
        },
        productos_mas_vendidos: productosArray,
        usuario_actual: usuario
    });
}

// 👤 REPORTE POR CAJERO
app.get('/api/ventas/reporte/cajeros', requireAuth, (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    
    const fechaInicio = fecha_inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = fecha_fin || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    const query = `
        SELECT 
            u.username as cajero,
            u.tipo,
            COUNT(v.id) as total_ventas,
            SUM(v.total) as monto_total,
            AVG(v.total) as promedio_venta
        FROM ventas v
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        WHERE DATE(v.fecha) BETWEEN ? AND ?
        GROUP BY v.usuario_id
        ORDER BY monto_total DESC
    `;
    
    console.log('👤 Consultando reporte cajeros:', fechaInicio, fechaFin);
    
    db.all(query, [fechaInicio, fechaFin], (err, rows) => {
        if (err) {
            console.error('❌ Error reporte cajeros:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json(rows);
    });
});

// 📦 REPORTE POR PRODUCTOS
app.get('/api/ventas/reporte/productos', requireAuth, (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;
    
    const fechaInicio = fecha_inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = fecha_fin || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    const queryVentas = `
        SELECT productos_vendidos 
        FROM ventas 
        WHERE DATE(fecha) BETWEEN ? AND ?
    `;
    
    console.log('📦 Consultando reporte productos:', fechaInicio, fechaFin);
    
    db.all(queryVentas, [fechaInicio, fechaFin], (err, ventas) => {
        if (err) {
            console.error('❌ Error reporte productos:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Procesar todos los productos de todas las ventas
        const productosMap = new Map();
        
        ventas.forEach(venta => {
            try {
                const productos = JSON.parse(venta.productos_vendidos);
                productos.forEach(prod => {
                    const key = prod.nombre;
                    if (!productosMap.has(key)) {
                        productosMap.set(key, {
                            nombre: prod.nombre,
                            total_vendido: 0,
                            monto_total: 0
                        });
                    }
                    const producto = productosMap.get(key);
                    producto.total_vendido += prod.cantidad;
                    producto.monto_total += prod.precio * prod.cantidad;
                });
            } catch (error) {
                console.error('Error procesando productos:', error);
            }
        });
        
        // Convertir a array y ordenar
        const productosArray = Array.from(productosMap.values())
            .sort((a, b) => b.total_vendido - a.total_vendido)
            .slice(0, 20); // Top 20 productos
        
        res.json(productosArray);
    });
});

// 📊 REPORTE COMPARATIVO
app.get('/api/ventas/reporte/comparativo', requireAuth, (req, res) => {
    const { periodo_actual, periodo_anterior } = req.query;
    
    const mesActualInicio = periodo_actual || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const mesActualFin = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    const mesAnteriorInicio = periodo_anterior || new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0];
    const mesAnteriorFin = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0];
    
    console.log('📊 Comparativo:', mesActualInicio, 'vs', mesAnteriorInicio);
    
    // Consulta para mes actual
    const queryActual = `
        SELECT 
            COUNT(*) as total_ventas_cantidad,
            COALESCE(SUM(total), 0) as total_ventas
        FROM ventas 
        WHERE DATE(fecha) BETWEEN ? AND ?
    `;
    
    // Consulta para mes anterior
    const queryAnterior = `
        SELECT 
            COUNT(*) as total_ventas_cantidad,
            COALESCE(SUM(total), 0) as total_ventas
        FROM ventas 
        WHERE DATE(fecha) BETWEEN ? AND ?
    `;
    
    // Ejecutar ambas consultas
    db.get(queryActual, [mesActualInicio, mesActualFin], (err, actual) => {
        if (err) {
            console.error('❌ Error consulta actual:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        db.get(queryAnterior, [mesAnteriorInicio, mesAnteriorFin], (err, anterior) => {
            if (err) {
                console.error('❌ Error consulta anterior:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                actual: {
                    total_ventas: actual.total_ventas || 0,
                    total_ventas_cantidad: actual.total_ventas_cantidad || 0
                },
                anterior: {
                    total_ventas: anterior.total_ventas || 0,
                    total_ventas_cantidad: anterior.total_ventas_cantidad || 0
                }
            });
        });
    });
});

// 📈 REPORTE TENDENCIAS
app.get('/api/ventas/reporte/tendencias', requireAuth, (req, res) => {
    const { dias } = req.query;
    const diasConsulta = parseInt(dias) || 30;
    
    const fechaFin = new Date().toISOString().split('T')[0];
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - diasConsulta);
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    
    console.log('📈 Tendencias últimos', diasConsulta, 'días');
    
    const query = `
        SELECT 
            DATE(fecha) as fecha,
            COUNT(*) as cantidad_ventas,
            COALESCE(SUM(total), 0) as total
        FROM ventas 
        WHERE DATE(fecha) BETWEEN ? AND ?
        GROUP BY DATE(fecha)
        ORDER BY fecha DESC
    `;
    
    db.all(query, [fechaInicioStr, fechaFin], (err, rows) => {
        if (err) {
            console.error('❌ Error tendencias:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Calcular estadísticas
        const totalPeriodo = rows.reduce((sum, row) => sum + row.total, 0);
        const promedioDiario = totalPeriodo / (rows.length || 1);
        const mejorDia = rows.reduce((best, current) => 
            current.total > best.total ? current : best, { total: 0, fecha: '' });
        
        res.json({
            tendencias: rows,
            total_periodo: totalPeriodo,
            promedio_diario: promedioDiario,
            mejor_dia: mejorDia
        });
    });
});



// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 POS Tienda running at http://localhost:${PORT}`);
    console.log(`📊 Base de datos: ${dbPath}`);
});
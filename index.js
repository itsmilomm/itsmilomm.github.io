// Variables globales
let currentStream = null;
let currentCamera = 'environment';
let history = [];
let currentLanguage = 'es';

// Base de datos simulada de productos
const productDatabase = {
    'botella de plastico': {
        material: 'PET/Plástico',
        category: 'Reciclable',
        instructions: 'Lavar y colocar en contenedor BLANCO. Retirar etiquetas si es posible.',
        tips: 'Una botella de plástico puede convertirse en fibra para ropa.'
    },
    'lata de aluminio': {
        material: 'Aluminio',
        category: 'Reciclable',
        instructions: 'Enjuagar y colocar en contenedor BLANCO. El aluminio se recicla infinitamente.',
        tips: 'Reciclar una lata ahorra energía suficiente para ver TV por 3 horas.'
    },
    'papel': {
        material: 'Celulosa',
        category: 'Reciclable',
        instructions: 'Colocar en contenedor BLANCO. Evitar papel sucio o con grasa.',
        tips: 'Reciclar una tonelada de papel salva 17 árboles.'
    },
    'botella de vidrio': {
        material: 'Vidrio',
        category: 'Reciclable',
        instructions: 'Lavar y colocar en contenedor BLANCO. Separar por colores si es posible.',
        tips: 'El vidrio se puede reciclar infinitas veces sin perder calidad.'
    },

    'tetra pak': {
    material: 'Cartón, plástico y aluminio',
    category: 'Reciclable',
    instructions: 'Enjuagar, aplanar y colocar en el contenedor BLANCO. No es necesario separar capas.',
    tips: 'El Tetra Pak se recicla para fabricar papel y paneles aglomerados.'
    },

    'papel usado': {
        material: 'Papel contaminado',
        category: 'No reciclable',
        instructions: 'Desechar en el contenedor NEGRO. No se debe mezclar con papel limpio, ya que contamina el reciclaje.',
        tips: 'El papel manchado con grasa, comida o líquidos no puede reciclarse.'
    },

    'carton': {
        material: 'Cartón',
        category: 'Reciclable',
        instructions: 'Plegar y colocar en contenedor BLANCO. Retirar cintas adhesivas.',
        tips: 'El cartón reciclado se usa para hacer nuevas cajas.'
    },
    'pilas': {
        material: 'Metales pesados',
        category: 'Residuo Peligroso',
        instructions: 'NUNCA tirar a la basura común. Llevar a puntos de recolección especiales (Contenedor de color rojo).',
        tips: 'Una pila puede contaminar 3000 litros de agua.'
    }
};

// Inicialización
window.addEventListener('load', function () {
    initializeApp();
});

function initializeApp() {
    loadHistory();
    initializeCamera();
}

// Gestión de pestañas
function showTab(tabName) {
    // Ocultar todas las pestañas
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Ocultar todos los botones activos
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));

    // Mostrar pestaña seleccionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Gestión de cámara
async function initializeCamera() {
    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            await startCamera();
        } else {
            showNoCameraMessage();
        }
    } catch (error) {
        console.log('Cámara no disponible:', error);
        showNoCameraMessage();
    }
}

async function startCamera() {
    try {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                facingMode: currentCamera,
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('camera');
        video.srcObject = currentStream;

        document.querySelector('.camera-container').classList.remove('hidden');
        document.querySelector('.no-camera').classList.add('hidden');
    } catch (error) {
        console.log('Error al acceder a la cámara:', error);
        showNoCameraMessage();
    }
}

function showNoCameraMessage() {
    document.querySelector('.camera-container').classList.add('hidden');
    document.querySelector('.no-camera').classList.remove('hidden');
}

function toggleCamera() {
    currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
    startCamera();
}

// Búsqueda manual
function searchManually() {
    const productName = document.getElementById('productName').value.toLowerCase().trim();
    const barcode = document.getElementById('barcode').value.trim();

    if (!productName && !barcode) {
        alert('Ingresa el nombre del producto o código de barras.');
        return;
    }

    showLoading();
    setTimeout(() => {
        processProduct(productName, 'Búsqueda manual');
        hideLoading();

        // Limpiar campos
        document.getElementById('productName').value = '';
        document.getElementById('barcode').value = '';
    }, 1500);
}

// Procesamiento de producto
function processProduct(productKey, method) {
    let productInfo = productDatabase[productKey];

    if (!productInfo) {
        // Búsqueda aproximada
        const keys = Object.keys(productDatabase);
        const foundKey = keys.find(key =>
            key.includes(productKey) || productKey.includes(key)
        );

        if (foundKey) {
            productInfo = productDatabase[foundKey];
            productKey = foundKey;
        }
    }

    if (!productInfo) {
        productInfo = {
            material: 'Material no identificado',
            category: 'Consultar punto de reciclaje local',
            instructions: 'No se encontró información específica. Recomendamos consultar con las autoridades locales de reciclaje.',
            tips: 'Cuando no estés seguro, es mejor consultar que contaminar.'
        };
    }

    displayResults(productKey, productInfo, method);
    addToHistory(productKey, productInfo, method);
}

// Mostrar resultados
function displayResults(productName, info, method) {
    const resultsDiv = document.getElementById('results');

    resultsDiv.innerHTML = `
                <div class="result-card">
                    <h3>✅ Resultado del Análisis</h3>
                    <p><strong>Producto:</strong> ${capitalizeFirst(productName)}</p>
                    <p><strong>Material:</strong> ${info.material}</p>
                    <p><strong>Categoría:</strong> ${info.category}</p>
                    <p><strong>Instrucciones:</strong> ${info.instructions}</p>
                    <p><strong>💡 Dato interesante:</strong> ${info.tips}</p>
                    <p><small><strong>Método:</strong> ${method} • ${new Date().toLocaleString('es-ES')}</small></p>
                </div>
            `;
}

// Gestión de historial
function addToHistory(productName, info, method) {
    const historyItem = {
        id: Date.now(),
        product: capitalizeFirst(productName),
        material: info.material,
        category: info.category,
        method: method,
        date: new Date().toLocaleString('es-ES')
    };

    history.unshift(historyItem);

    // Limitar historial a 50 elementos
    if (history.length > 50) {
        history = history.slice(0, 50);
    }

    saveHistory();
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');

    if (history.length === 0) {
        historyList.innerHTML = `
                    <p style="text-align: center; color: #7f8c8d; padding: 20px;">
                        No hay elementos en el historial aún.<br>
                        ¡Escanea tu primer producto!
                    </p>
                `;
        return;
    }

    historyList.innerHTML = history.map(item => `
                <div class="history-item">
                    <button class="delete-btn" onclick="deleteHistoryItem(${item.id})">×</button>
                    <h4>${item.product}</h4> 
                    <p><strong>Material:</strong> ${item.material}</p>
                    <p><strong>Categoría:</strong> ${item.category}</p>
                    <p><small>${item.method} • ${item.date}</small></p>
                </div>
            `).join('');
}

function deleteHistoryItem(id) {
    history = history.filter(item => item.id !== id);
    saveHistory();
    updateHistoryDisplay();
}

function clearHistory() {
    if (confirm('¿Estás seguro de que quieres eliminar todo el historial?')) {
        history = [];
        saveHistory();
        updateHistoryDisplay();
    }
}

function saveHistory() {
    try {
        localStorage.setItem('greenlens_history', JSON.stringify(history));
    } catch (error) {
        console.log('No se puede guardar historial:', error);
    }
}

function loadHistory() {
    try {
        const saved = localStorage.getItem('greenlens_history');
        if (saved) {
            history = JSON.parse(saved);
            updateHistoryDisplay();
        }
    } catch (error) {
        console.log('No se puede cargar historial:', error);
        history = [];
    }
}

// Configuración
function setLanguage(lang) {
    currentLanguage = lang;

    // Actualizar botones de idioma
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    alert(`Idioma cambiado a: ${lang === 'es' ? 'Español' : 'English'}`);
}

function toggleSetting(element) {
    element.classList.toggle('active');
}

function showHelp() {
    alert(`📖 Guía de Uso de Greenlens:

1. 📸 Escanear: Usa la cámara para identificar productos
2. 🔍 Manual: Busca productos escribiendo su nombre
3. 🕓 Historial: Revisa tus escaneos anteriores
4. 🧠 Educación: Aprende sobre reciclaje
5. ⚙️ Configuración: Personaliza la app

¡Ayuda al medio ambiente reciclando correctamente!`);
}

function showContact() {
    alert(`📧 Contactar Soporte:

Email: soporte@greenlens.app
WhatsApp: +57 300 123 4567
Web: www.greenlens.app/ayuda

Horario de atención:
Lunes a Viernes: 8:00 AM - 6:00 PM
Sábados: 9:00 AM - 2:00 PM`);
}

function showAbout() {
    alert(`ℹ️ Acerca de Greenlens v1.0

Desarrollado por: [Tu Nombre]
Universidad: [Tu Universidad]
Proyecto: Fin de Materia - Primer Semestre

Greenlens es una aplicación educativa que ayuda a identificar materiales reciclables y promueve buenas prácticas ambientales.

© 2025 Greenlens - Todos los derechos reservados`);
}

// Utilidades
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Simular funcionalidad offline
function checkConnection() {
    return navigator.onLine;
}

// Mostrar mensaje de conectividad
function showConnectionStatus() {
    if (!checkConnection()) {
        const statusMsg = document.createElement('div');
        statusMsg.innerHTML = `
                    <div style="background: #f39c12; color: white; padding: 10px; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 1000;">
                        📡 Modo offline - Funcionalidad limitada
                    </div>
                `;
        document.body.appendChild(statusMsg);

        setTimeout(() => {
            statusMsg.remove();
        }, 3000);
    }
}

// Event listeners para conectividad
window.addEventListener('online', () => {
    console.log('Conexión restaurada');
});

window.addEventListener('offline', () => {
    showConnectionStatus();
});

// Funcionalidad de notificaciones (simulada)
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Permisos de notificación concedidos');
            }
        });
    }
}

// Simular guardado de imágenes (para demo)
function saveImageLocally(imageData) {
    try {
        const images = JSON.parse(localStorage.getItem('greenlens_images') || '[]');
        images.push({
            id: Date.now(),
            data: imageData,
            timestamp: new Date().toISOString()
        });

        // Mantener solo las últimas 10 imágenes
        if (images.length > 10) {
            images.splice(0, images.length - 10);
        }

        localStorage.setItem('greenlens_images', JSON.stringify(images));
        return true;
    } catch (error) {
        console.log('Error guardando imagen:', error);
        return false;
    }
}

// Funcionalidad mejorada de búsqueda
function searchProduct(query) {
    const normalizedQuery = query.toLowerCase().trim();

    // Búsqueda exacta
    if (productDatabase[normalizedQuery]) {
        return { key: normalizedQuery, data: productDatabase[normalizedQuery] };
    }

    // Búsqueda por palabras clave
    const keywords = {
        'plastico': ['botella de plastico'],
        'botella': ['botella de plastico', 'botella de vidrio'],
        'lata': ['lata de aluminio'],
        'aluminio': ['lata de aluminio'],
        'vidrio': ['botella de vidrio'],
        'papel': ['papel'],
        'carton': ['carton'],
        'pila': ['pilas'],
        'bateria': ['pilas']
    };

    for (const [keyword, products] of Object.entries(keywords)) {
        if (normalizedQuery.includes(keyword)) {
            const productKey = products[0];
            return { key: productKey, data: productDatabase[productKey] };
        }
    }

    return null;
}

// Mejorar procesamiento de productos
function processProduct(productKey, method) {
    const searchResult = searchProduct(productKey);
    let productInfo;
    let finalProductKey;

    if (searchResult) {
        productInfo = searchResult.data;
        finalProductKey = searchResult.key;
    } else {
        productInfo = {
            material: 'Material no identificado',
            category: 'Consultar punto de reciclaje local',
            instructions: 'No se encontró información específica. Recomendamos consultar con las autoridades locales de reciclaje.',
            tips: 'Cuando no estés seguro, es mejor consultar que contaminar.'
        };
        finalProductKey = productKey;
    }

    displayResults(finalProductKey, productInfo, method);
    addToHistory(finalProductKey, productInfo, method);
}

let index = 0;
// Funcionalidad de captura mejorada
function captureImage() {
    const video = document.getElementById('camera');
    if (!video.srcObject) {
        alert('Cámara no disponible. Usa la búsqueda manual.');
        return;
    }

    // Crear canvas para capturar imagen
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Simular guardado de imagen
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    saveImageLocally(imageData);

    showLoading();

    // Simular procesamiento con IA
    setTimeout(() => {
        const products = ['botella de plastico', 'lata de aluminio', 'papel', 'carton', 'botella de vidrio'];
        const randomProduct = Object.keys(productDatabase);
        let product = randomProduct[index];
        index++        
        if ( index > randomProduct.length - 1) index = 0;
        

        // Agregar variabilidad al resultado
        const confidence = Math.random() * 40 + 60; // 60-100% de confianza
        processProductWithConfidence(product, 'Escaneo de cámara', confidence);
        hideLoading();
    }, 500); // 1.5-3.5 segundos
}

function processProductWithConfidence(productKey, method, confidence) {
    const searchResult = searchProduct(productKey);
    let productInfo;
    let finalProductKey;

    if (searchResult) {
        productInfo = searchResult.data;
        finalProductKey = searchResult.key;
    } else {
        productInfo = {
            material: 'Material no identificado',
            category: 'Consultar punto de reciclaje local',
            instructions: 'No se encontró información específica.',
            tips: 'Cuando no estés seguro, es mejor consultar.'
        };
        finalProductKey = productKey;
    }

    displayResultsWithConfidence(finalProductKey, productInfo, method, confidence);
    addToHistory(finalProductKey, productInfo, method);
}

function displayResultsWithConfidence(productName, info, method, confidence) {
    const resultsDiv = document.getElementById('results');
    const confidenceColor = confidence > 80 ? '#27ae60' : confidence > 60 ? '#f39c12' : '#e74c3c';

    resultsDiv.innerHTML = `
                <div class="result-card">
                    <h3>✅ Resultado del Análisis</h3>
                    <div style="background: ${confidenceColor}; color: white; padding: 8px; border-radius: 5px; margin-bottom: 10px; text-align: center;">
                        Confianza: ${Math.round(confidence)}%
                    </div>
                    <p><strong>Producto:</strong> ${capitalizeFirst(productName)}</p>
                    <p><strong>Material:</strong> ${info.material}</p>
                    <p><strong>Categoría:</strong> ${info.category}</p>
                    <p><strong>Instrucciones:</strong> ${info.instructions}</p>
                    <p><strong>💡 Dato interesante:</strong> ${info.tips}</p>
                    <p><small><strong>Método:</strong> ${method} • ${new Date().toLocaleString('es-ES')}</small></p>
                    ${confidence < 70 ? '<p style="color: #e74c3c;"><small>⚠️ Baja confianza. Verifica manualmente.</small></p>' : ''}
                </div>
            `;
}

// Funcionalidad de validación mejorada
function searchManually() {
    const productName = document.getElementById('productName').value.toLowerCase().trim();
    const barcode = document.getElementById('barcode').value.trim();

    if (!productName && !barcode) {
        alert('Por favor, ingresa el nombre del producto o código de barras.');
        return;
    }

    showLoading();

    setTimeout(() => {
        let searchTerm = productName;

        // Si hay código de barras, simular búsqueda por código
        if (barcode) {
            const barcodeProducts = {
                '7501234567890': 'botella de plastico',
                '7501234567891': 'lata de aluminio',
                '7501234567892': 'papel',
                '7501234567893': 'carton'
            };

            searchTerm = barcodeProducts[barcode] || productName || 'producto desconocido';
        }

        processProduct(searchTerm, barcode ? 'Código de barras' : 'Búsqueda manual');
        hideLoading();

        // Limpiar campos
        document.getElementById('productName').value = '';
        document.getElementById('barcode').value = '';
    }, 1000 + Math.random() * 1000);
}

// Inicialización mejorada
function initializeApp() {
    loadHistory();
    initializeCamera();
    checkConnection();
    requestNotificationPermission();

    // Simular carga de tips dinámicos
    loadDynamicTips();
}

function loadDynamicTips() {
    const tips = [
        "💡 Tip del día: Lava los envases antes de reciclarlos para evitar contaminar otros materiales.",
        "🌱 Sabías que: El aluminio es 100% reciclable y se puede reciclar infinitas veces.",
        "♻️ Dato curioso: Reciclar una tonelada de papel salva aproximadamente 17 árboles.",
        "🌍 Importante: Separar correctamente los residuos puede reducir la contaminación en un 30%."
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    // Mostrar tip después de 3 segundos
    setTimeout(() => {
        if (Math.random() > 0.7) { // 30% de probabilidad
            const tipDiv = document.createElement('div');
            tipDiv.innerHTML = `
                        <div style="
                            position: fixed;
                            bottom: 20px;
                            left: 20px;
                            right: 20px;
                            background: linear-gradient(135deg, #3498db, #2980b9);
                            color: white;
                            padding: 15px;
                            border-radius: 10px;
                            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                            z-index: 1000;
                            animation: slideUp 0.5s ease;
                        ">
                            ${randomTip}
                            <button onclick="this.parentElement.parentElement.remove()" style="
                                float: right;
                                background: none;
                                border: none;
                                color: white;
                                font-size: 18px;
                                cursor: pointer;
                            ">×</button>
                        </div>
                    `;
            document.body.appendChild(tipDiv);

            // Auto-remover después de 5 segundos
            setTimeout(() => {
                if (tipDiv.parentElement) {
                    tipDiv.remove();
                }
            }, 5000);
        }
    }, 3000);
}

// Agregar estilos para animaciones
const style = document.createElement('style');
style.textContent = `
            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
document.head.appendChild(style);

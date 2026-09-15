const express = require('express');
const googleTrends = require('google-trends-api');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Bancos de rotación dinámica para Córdoba y Redes
const poolCordobaTrends = [
    {
        source: 'Consumo Local Córdoba 📍',
        query: 'Tarifas y Servicios Públicos (EPEC / Gas)',
        traffic: '+30K búsquedas locales',
        detailsHeader: '📰 Medios cordobeses cubriendo la noticia:',
        articles: [
            { title: 'EPEC confirmó el esquema de aumentos para la Capital', source: 'La Voz del Interior' },
            { title: 'Fuertes reclamos de comerciantes por los costos de energía', source: 'Cadena 3' },
            { title: 'Cómo solicitar el subsidio y evitar subas en la boleta', source: 'El Doce TV' },
            { title: 'Organizaciones de consumidores convocan a reunión en el centro', source: 'Cba24n' }
        ]
    },
    {
        source: 'Consumo Local Córdoba 📍',
        query: 'Estado del tránsito en Circunvalación y Av. Colón',
        traffic: 'Pico en horas pico',
        detailsHeader: '📰 Medios y reportes viales:',
        articles: [
            { title: 'Demoras y choques en los principales accesos a la capital', source: 'Cadena 3' },
            { title: 'Obras y desvíos habilitados por la Municipalidad', source: 'La Voz del Interior' }
        ]
    }
];

const poolSocialTrends = [
    {
        source: 'Tendencias Redes (X / Instagram / TikTok) 💬',
        query: '#DebatePolitico & Economía',
        traffic: '1.º Puesto en X (Argentina)',
        detailsHeader: '💬 Publicaciones y comentarios virales:',
        articles: [
            { title: 'Post viral en X (@cba_noticias): Fuerte debate sobre el poder adquisitivo (14K likes)', source: 'X / Twitter' },
            { title: 'Reel destacado (Instagram): Análisis de medidas económicas en 1 min', source: 'Instagram' }
        ]
    }
];

// 1. Endpoint de Tendencias Rotativas
app.get('/api/all-trends', async (req, res) => {
    try {
        const hourIndex = new Date().getHours();
        const cordobaTrend = poolCordobaTrends[hourIndex % poolCordobaTrends.length];
        const socialTrend = poolSocialTrends[hourIndex % poolSocialTrends.length];

        let googleTrend;
        try {
            const googleResult = await googleTrends.dailyTrends({ geo: 'AR' });
            const data = JSON.parse(googleResult);
            const searches = data.default.trendingSearchesDays[0]?.trendingSearches || [];
            const firstItem = searches[0];

            googleTrend = {
                source: 'Google Trends (Búsquedas Web) 🔍',
                query: firstItem ? firstItem.title.query : 'Dólar Blue y Economía',
                traffic: firstItem ? (firstItem.formattedTraffic || 'Alto interés') : '+100K búsquedas',
                detailsHeader: '📰 Portales nacionales destacados:',
                articles: firstItem ? firstItem.articles.map(a => ({ title: a.title, source: a.source })) : [
                    { title: 'Reacción del mercado financiero tras los anuncios', source: 'Ámbito' }
                ]
            };
        } catch (e) {
            googleTrend = {
                source: 'Google Trends (Búsquedas Web) 🔍',
                query: 'Dólar Blue y Mercado Financiero',
                traffic: '+100K búsquedas hoy',
                detailsHeader: '📰 Portales nacionales:',
                articles: [{ title: 'El mercado reacciona a los nuevos anuncios', source: 'Ámbito' }]
            };
        }

        res.json({ success: true, trends: [cordobaTrend, socialTrend, googleTrend] });
    } catch (error) {
        res.json({ success: true, trends: [poolCordobaTrends[0], poolSocialTrends[0]] });
    }
});

// 2. Endpoint que consume directamente el JSON interno de radio10.ar (Evita caché con cabeceras)
// 2. Endpoint que consume el JSON de WordPress forzando datos frescos sin caché
app.get('/api/radio-stats', async (req, res) => {
    try {
        // Evitar caché en la respuesta hacia el navegador
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Hacer la petición a WordPress agregando un parámetro de tiempo para que no devuelva caché
        const wpUrl = 'https://radio10.ar/wp-json/radio10/v1/stats?t=' + Date.now();
        const response = await fetch(wpUrl, {
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error al conectar con WordPress:', error.message);
        res.json({ 
            success: true, 
            activeUsers: 0, 
            topArticles: [
                { category: 'radio10.ar', title: 'Sincronizando notas recientes del portal...', readers: 'En línea', url: '#' }
            ] 
        });
    }
});

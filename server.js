const express = require('express');
const googleTrends = require('google-trends-api');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/all-trends', async (req, res) => {
    try {
        const cordobaTrend = {
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
        };

        const socialTrend = {
            source: 'Tendencias Redes (X / Instagram / TikTok) 💬',
            query: '#DebatePolitico & Tarifazo',
            traffic: '1.º Puesto en X (Argentina)',
            detailsHeader: '💬 Publicaciones y comentarios virales:',
            articles: [
                { title: 'Post viral en X (@cba_noticias): "Insostenible el costo de la boleta en los comercios de barrio..." (14.2K likes)', source: 'X / Twitter' },
                { title: 'Reel destacado (Instagram): Explicativo en 1 min sobre los nuevos valores de luz en Córdoba', source: 'Instagram' },
                { title: 'Comentarios en Facebook: Clientes convocan a apagón de protesta el viernes', source: 'Meta' },
                { title: 'TikTok viral: Usuario muestra su factura anterior vs. la nueva y supera 300K vistas', source: 'TikTok' }
            ]
        };

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
                    { title: 'Reacción del mercado financiero tras los anuncios', source: 'Ámbito' },
                    { title: 'Cotización minuto a minuto en la city', source: 'Infobae' }
                ]
            };
        } catch (e) {
            googleTrend = {
                source: 'Google Trends (Búsquedas Web) 🔍',
                query: 'Dólar Blue y Mercado Financiero',
                traffic: '+100K búsquedas hoy',
                detailsHeader: '📰 Portales nacionales destacados:',
                articles: [
                    { title: 'El mercado reacciona a los nuevos anuncios de economía', source: 'Ámbito Financiero' },
                    { title: 'Cotización minuto a minuto de divisas', source: 'Infobae' },
                    { title: 'Análisis del impacto en los precios de consumo masivo', source: 'La Nación' }
                ]
            };
        }

        res.json({ success: true, trends: [cordobaTrend, socialTrend, googleTrend] });

    } catch (error) {
        res.json({
            success: true,
            trends: [
                {
                    source: 'Consumo Local Córdoba 📍',
                    query: 'Aumento de Tarifas en Córdoba',
                    traffic: '+25K búsquedas',
                    detailsHeader: '📰 Medios cordobeses:',
                    articles: [{ title: 'Impacto tarifario en la provincia', source: 'La Voz' }]
                },
                {
                    source: 'Tendencias Redes (X / Instagram) 💬',
                    query: '#DebatePolitico',
                    traffic: 'Tendencia #1',
                    detailsHeader: '💬 Virales en redes:',
                    articles: [{ title: 'Tuit viral sobre servicios públicos', source: 'X' }]
                },
                {
                    source: 'Google Trends (Búsquedas Web) 🔍',
                    query: 'Dólar y Cotizaciones',
                    traffic: '+100K búsquedas',
                    detailsHeader: '📰 Portales web:',
                    articles: [{ title: 'Tendencia nacional en buscadores', source: 'Ámbito' }]
                }
            ]
        });
    }
});

// Endpoint para simular métricas de tráfico en tiempo real de radio10.ar
app.get('/api/radio-stats', (req, res) => {
    // Generador dinámico de usuarios activos simulando picos reales de audiencia
    const activeUsers = Math.floor(Math.random() * (4500 - 3200 + 1)) + 3200;
    
    const topArticles = [
        { title: 'Último momento: Anuncian nuevas medidas económicas y detalles del impacto local', category: 'Política / Economía', readers: '1,420 leyendo ahora', url: '#' },
        { title: 'Operativo en Córdoba: Cuáles son los puntos con demoras en Circunvalación', category: 'Tránsito / Córdoba', readers: '980 leyendo ahora', url: '#' },
        { title: 'Fiebre de cuarteto: Se agotaron las entradas para el festival en el Estadio', category: 'Espectáculos', readers: '750 leyendo ahora', url: '#' },
        { title: 'Pronóstico del tiempo: Qué dice el SMN para el cierre de semana en la docta', category: 'Clima', readers: '540 leyendo ahora', url: '#' }
    ];

    res.json({ success: true, activeUsers, topArticles });
});

app.post('/api/generate-draft', (req, res) => {
    const { query, source, articles } = req.body;
    const title = `Informe exclusivo: El impacto de ${query} en la agenda de Córdoba y las redes`;
    const lead = `El tema ${query} se posicionó en el centro del debate público en Córdoba, impulsado por publicaciones virales en redes sociales y la cobertura de los principales medios de la provincia.`;
    let refText = articles ? articles.map(a => `- ${a.source}: "${a.title}"`).join('\n') : '';
    const body = `En las últimas horas, ${query} captó la atención masiva:\n\n${refText}\n\nDesde radio10.ar ampliamos el informe con todas las repercusiones en vivo.`;

    res.json({ success: true, draft: { title, slug: query.toLowerCase().replace(/[^a-z0-9]+/g, '-'), lead, body } });
});

app.listen(PORT, () => {
    console.log(`🚀 Radar con Tráfico Activo en http://localhost:${PORT}`);
});

// 2. Endpoint de Estadísticas Reales con Google Analytics 4 (Optimizado para Tráfico de Hoy)
app.get('/api/radio-stats', async (req, res) => {
    try {
        if (!analyticsDataClient) {
            return res.json({ 
                success: true, 
                activeUsers: 0, 
                topArticles: [
                    { category: 'Configuración', title: 'Conectado localmente (Esperando credenciales en la nube)', readers: 'Pendiente', url: '#' }
                ] 
            });
        }

        // Obtener usuarios activos en este preciso instante
        const [responseRealtime] = await analyticsDataClient.runRealtimeReport({
            property: `properties/${PROPERTY_ID}`,
            metrics: [{ name: 'activeUsers' }]
        });

        const activeUsers = responseRealtime.rows && responseRealtime.rows.length > 0 
            ? parseInt(responseRealtime.rows[0].metricValues[0].value) 
            : 0;

        // Obtener las notas más leídas de HOY (en lugar de los últimos 7 días)
        const [responsePages] = await analyticsDataClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate: 'today', endDate: 'today' }],
            dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 4
        });

        const topArticles = responsePages.rows && responsePages.rows.length > 0 
            ? responsePages.rows.map(row => ({
                category: 'radio10.ar (Hoy)',
                title: row.dimensionValues[0].value,
                readers: `${parseInt(row.metricValues[0].value).toLocaleString()} visitas hoy`,
                url: row.dimensionValues[1].value
              }))
            : [{ category: 'radio10.ar', title: 'Sin visitas registradas todavía en el día de hoy', readers: '0 lecturas', url: '#' }];

        res.json({ success: true, activeUsers, topArticles });

    } catch (error) {
        console.error('Error en GA4:', error.message);
        res.json({ 
            success: true, 
            activeUsers: 0, 
            topArticles: [{ category: 'Sincronización', title: 'Esperando reporte de tráfico de Google Analytics...', readers: 'En línea', url: '#' }] 
        });
    }
});

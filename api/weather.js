export default async function handler(req, res) {
    // 1. Retrieve the API Key from environment variables
    // Make sure to add OPENWEATHER_API_KEY in your Vercel Project Settings
    const apiKey = process.env.24660a77f576b961d854459d7479030b;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'Server Error: API Key is missing.' });
    }

    // 2. Get the city from the query parameters
    const { city } = req.query;

    if (!city) {
        return res.status(400).json({ error: 'City name is required.' });
    }

    try {
        // 3. Fetch data from OpenWeatherMap (Current + Forecast) in parallel
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=ja&appid=${apiKey}`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=ja&appid=${apiKey}`)
        ]);

        // 4. Parse responses
        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        // 5. Check for OpenWeatherMap errors (e.g., City not found)
        if (currentData.cod !== 200) {
            return res.status(currentData.cod).json({ error: currentData.message });
        }

        // 6. Return combined data to frontend
        return res.status(200).json({
            current: currentData,
            forecast: forecastData
        });

    } catch (error) {
        console.error('Weather API Error:', error);
        return res.status(500).json({ error: 'Failed to fetch weather data.' });
    }
}

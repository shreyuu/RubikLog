export const fetchData = async (url, options = {}) => {
    try {
        const response = await fetchWithTimeout(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData);
            } catch {
                errorMessage = errorText || `HTTP Error ${response.status}`;
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
};
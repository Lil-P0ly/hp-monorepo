import React, { useState, useEffect } from 'react';

function Settings({ settings, onSettingsChange }) {
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);  // Обновляем локальное состояние, когда settings меняются
    }, [settings]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalSettings(prevSettings => ({
            ...prevSettings,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSettingsChange(localSettings); // Отправляем изменения наверх
    };

    return (
        <div>
            <h2>Settings</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="honeypotName">Honeypot Name:</label>
                    <input
                        type="text"
                        id="honeypotName"
                        name="honeypotName"
                        value={localSettings.honeypotName}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label htmlFor="alertThreshold">Alert Threshold:</label>
                    <input
                        type="number"
                        id="alertThreshold"
                        name="alertThreshold"
                        value={localSettings.alertThreshold}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit">Save Settings</button>
            </form>
        </div>
    );
}

export default Settings;
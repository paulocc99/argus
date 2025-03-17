import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { getHealth, getStatus } from 'api';

const StatusWrapper = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [loaded, setLoaded] = useState(false);

    const fetchHealth = async () => {
        try {
            await getHealth();
            const isAuthenticated = localStorage.getItem('auth');
            if (['/setup', '/login'].includes(location.pathname)) {
                if (isAuthenticated) {
                    navigate('/');
                    return;
                }
                navigate('/login');
            }
        } catch (error) {
            if (error && error.response?.status == 404) {
                try {
                    await getStatus();
                    navigate('/setup');
                    await new Promise((resolve) => setTimeout(resolve, 500));
                } catch (err) {
                    console.log(err);
                }
            }
        } finally {
            setLoaded(true);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    if (loaded) return children;
    return null;
};

export default StatusWrapper;

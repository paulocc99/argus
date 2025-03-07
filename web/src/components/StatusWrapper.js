import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getHealth, getStatus } from 'api';

const StatusWrapper = ({ children }) => {
    const navigate = useNavigate();

    const [loaded, setLoaded] = useState(false);

    const fetchHealth = async () => {
        try {
            await getHealth();
        } catch (error) {
            if (error && error.response?.status == 404) {
                getStatus()
                    .then(() => navigate('/setup'))
                    .catch((e) => console.log(e));
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

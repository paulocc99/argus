import { Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { getStatus } from 'api';
import { capitalizeWord } from 'utils';
import { AlertStatus } from 'common/Status';
import AuthSetup from './auth-forms/AuthSetup';
import AuthWrapper from './AuthWrapper';

const Register = () => {
    const [status, setStatus] = useState({});

    const fetchStatus = async () => {
        const response = await getStatus();
        setStatus(response.data);
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    return (
        <AuthWrapper>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
                        <Typography variant="h3">Argus Setup</Typography>
                    </Stack>
                </Grid>
                <Grid item>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Connection Status
                    </Typography>
                    {Object.keys(status).length > 0 &&
                        Object.entries(status).map(([service, result]) => {
                            const status = result.status ? 'resolved' : 'open';
                            const message = `${capitalizeWord(service)} - ${result.status ? 'Healthy' : result.message}`;
                            return <AlertStatus status={status} title={message} />;
                        })}
                    <Typography variant="h5" sx={{ mb: 2, mt: 2 }}>
                        Administrator Account
                    </Typography>
                    <AuthSetup />
                </Grid>
            </Grid>
        </AuthWrapper>
    );
};

export default Register;

import { Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { getHealth } from 'api';
import { AlertStatus } from 'common/Status';

import FirebaseRegister from './auth-forms/AuthRegister';
import AuthWrapper from './AuthWrapper';
import { capitalizeWord } from 'utils';

const Register = () => {
    const [status, setStatus] = useState({});

    const getHealthStatus = async () => {
        const response = await getHealth();
        setStatus(response.data);
    };

    useEffect(() => {
        getHealthStatus();
    }, []);

    console.log(Object.keys(status).length);
    console.log(status);

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
                    <FirebaseRegister />
                </Grid>
            </Grid>
        </AuthWrapper>
    );
};

export default Register;

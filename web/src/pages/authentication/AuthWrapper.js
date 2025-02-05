import { Box, Grid, Typography } from '@mui/material';

import MainCard from 'components/cards/MainCard';
import Logo from 'components/Logo';

const AuthCard = ({ children, ...other }) => (
    <MainCard
        sx={{
            maxWidth: { xs: 400, lg: 475 },
            margin: { xs: 2.5, md: 3 },
            '& > *': {
                flexGrow: 1,
                flexBasis: '50%'
            }
        }}
        content={false}
        {...other}
        border={false}
        boxShadow
        shadow={(theme) => theme.customShadows.z1}
    >
        <Box sx={{ p: { xs: 2, sm: 3, md: 4, xl: 5 } }}>{children}</Box>
    </MainCard>
);

export const AuthWrapper = ({ children }) => (
    <Box sx={{ minHeight: '100vh' }}>
        <Grid
            container
            direction="column"
            justifyContent="flex-end"
            sx={{
                minHeight: '100vh'
            }}
        >
            <Grid item xs={12}>
                <Grid
                    item
                    xs={12}
                    container
                    justifyContent="center"
                    alignItems="center"
                    sx={{ minHeight: { xs: 'calc(100vh - 134px)', md: 'calc(100vh - 112px)' } }}
                >
                    <Grid item>
                        <Grid display="flex" justifyContent="center" alignItems="center">
                            <Logo />
                            <Typography variant="h2" sx={{ ml: 2 }}>
                                ARGUS
                            </Typography>
                        </Grid>
                        <AuthCard>{children}</AuthCard>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    </Box>
);

export default AuthWrapper;

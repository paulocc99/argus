import { Box, Grid, Stack, Typography, Icon, LinearProgress } from '@mui/material';

import MainCard from 'components/cards/MainCard';

const AnalyticCard = ({ title, count, loading, OpIcon }) => (
    <MainCard contentSX={{ p: 2.25 }}>
        <Stack direction="row">
            <Icon sx={{ overflow: 'visible' }}>{OpIcon}</Icon>
            <Stack spacing={0.5} sx={{ ml: 1.5, mt: 0.5 }}>
                <Typography variant="h6" color="textSecondary">
                    {title}
                </Typography>
                <Grid container alignItems="center">
                    <Grid item>
                        {loading ? (
                            <Box sx={{ width: '50px', height: '10px' }}>
                                <LinearProgress sx={{ mt: 2 }} />
                            </Box>
                        ) : (
                            <Typography variant="h4" color="inherit">
                                {count}
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </Stack>
        </Stack>
    </MainCard>
);

export default AnalyticCard;

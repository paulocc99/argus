import { useEffect, useState } from 'react';

import { Grid, Skeleton, Stack } from '@mui/material';

import MainCard from 'components/cards/MainCard';

const ComponentSkeleton = ({ children }) => {
    const [isLoading, setLoading] = useState(true);

    const skeletonCard = (
        <MainCard
            title={<Skeleton sx={{ width: { xs: 120, md: 180 } }} />}
            secondary={<Skeleton animation="wave" variant="circular" width={24} height={24} />}
        >
            <Stack spacing={1}>
                <Skeleton />
                <Skeleton sx={{ height: 64 }} animation="wave" variant="rectangular" />
                <Skeleton />
                <Skeleton />
            </Stack>
        </MainCard>
    );

    useEffect(() => {
        setLoading(false);
    }, []);

    return (
        <>
            {isLoading && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        {skeletonCard}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {skeletonCard}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {skeletonCard}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {skeletonCard}
                    </Grid>
                </Grid>
            )}
            {!isLoading && children}
        </>
    );
};

export default ComponentSkeleton;

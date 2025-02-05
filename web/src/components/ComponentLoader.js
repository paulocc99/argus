import { CircularProgress, Grid, Skeleton, Stack } from '@mui/material';

const defaultHeight = '500px';

const ComponentLoader = ({ children, loading, height }) => {
    return (
        <>
            {loading && (
                <Grid display="flex" justifyContent="center" alignItems="center" sx={{ mt: 2, height: height || defaultHeight }}>
                    <CircularProgress size={36} />
                </Grid>
            )}
            {!loading && children}
        </>
    );
};

export default ComponentLoader;

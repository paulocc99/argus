import { CircularProgress, Grid } from '@mui/material';

const defaultHeight = '500px';

const ComponentLoader = ({ children, loading, height }) => {
    const style = { mt: 2, height: height || defaultHeight };

    return (
        <>
            {loading && (
                <Grid display="flex" justifyContent="center" alignItems="center" sx={style}>
                    <CircularProgress size={36} />
                </Grid>
            )}
            {!loading && children}
        </>
    );
};

export default ComponentLoader;

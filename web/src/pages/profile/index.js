import { useState, useEffect } from 'react';

import {
    Stack,
    Grid,
    InputLabel,
    OutlinedInput,
    FormControl,
    Button,
    Box,
    FormHelperText,
    IconButton,
    InputAdornment,
    Typography,
    Divider,
    Chip
} from '@mui/material';

import * as Yup from 'yup';
import { Formik } from 'formik';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

import { getUserData } from 'api';
import { setSuccess, setError } from 'utils';
import ComponentSkeleton from 'common/ComponentSkeleton';
import MainCard from 'components/cards/MainCard';
import AnimateButton from 'components/@extended/AnimateButton';
import { strengthColor, strengthIndicator } from 'utils/password-strength';
import { updateUserPassword } from 'api';

export default function Profile(props) {
    const [username, setUsername] = useState();
    const [email, setEmail] = useState();

    const [level, setLevel] = useState();
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const changePassword = (value) => {
        const temp = strengthIndicator(value);
        setLevel(strengthColor(temp));
    };

    // API
    const fetchUser = async () => {
        try {
            const response = await getUserData();
            const { username, email } = response.data;
            setUsername(username);
            setEmail(email);
        } catch (error) {
            setError(error);
        }
    };

    // Hooks
    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        changePassword('');
    }, []);

    return (
        <ComponentSkeleton>
            <Typography variant="h5">My Profile</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                    <MainCard sx={{ mt: 2 }}>
                        <Formik
                            initialValues={{
                                currentPassword: '',
                                newPassword: '',
                                newPasswordConfirmation: '',
                                submit: null
                            }}
                            validationSchema={Yup.object().shape({
                                currentPassword: Yup.string().max(255).required('The current password is required'),
                                newPassword: Yup.string().max(255).required('A new password is required'),
                                newPasswordConfirmation: Yup.string().oneOf([Yup.ref('newPassword')], 'Passwords must match')
                            })}
                            on
                            onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
                                try {
                                    const data = {
                                        password: values.currentPassword,
                                        new_password: values.newPassword,
                                        confirmation: values.newPasswordConfirmation
                                    };
                                    await updateUserPassword(data);
                                    setStatus({ success: true });
                                    setSuccess('Password changed');
                                } catch (err) {
                                    console.error(err);
                                    setStatus({ success: false });
                                    setErrors({ submit: err.message });
                                }
                                setSubmitting(false);
                            }}
                        >
                            {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                                <form noValidate onSubmit={handleSubmit}>
                                    <Grid item xs={6}>
                                        <Stack spacing={1}>
                                            <InputLabel htmlFor="username">Username</InputLabel>
                                            <OutlinedInput fullWidth id="username" value={username} name="username" onBlur={handleBlur} />
                                        </Stack>
                                        <Stack spacing={1} sx={{ mt: 1 }}>
                                            <InputLabel htmlFor="email">Email</InputLabel>
                                            <OutlinedInput fullWidth id="email" value={email} name="email" onBlur={handleBlur} />
                                        </Stack>
                                        <Divider fullWidth sx={{ mt: 2, mb: 2 }} />
                                        <Stack spacing={1} sx={{ mt: 1 }}>
                                            <InputLabel htmlFor="password-current">Current Password</InputLabel>
                                            <OutlinedInput
                                                fullWidth
                                                error={Boolean(touched.currentPassword && errors.currentPassword)}
                                                id="password-current"
                                                type={showPassword ? 'text' : 'password'}
                                                value={values.currentPassword}
                                                name="currentPassword"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                endAdornment={
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="toggle password visibility"
                                                            onClick={handleClickShowPassword}
                                                            onMouseDown={handleMouseDownPassword}
                                                            edge="end"
                                                            size="large"
                                                        >
                                                            {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                }
                                                placeholder="******"
                                                inputProps={{}}
                                            />
                                            {touched.currentPassword && errors.currentPassword && (
                                                <FormHelperText error id="helper-text-password-new">
                                                    {errors.currentPassword}
                                                </FormHelperText>
                                            )}
                                        </Stack>
                                    </Grid>
                                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                        <Grid item xs={6}>
                                            <Stack spacing={1}>
                                                <InputLabel htmlFor="password-new">New Password</InputLabel>
                                                <OutlinedInput
                                                    fullWidth
                                                    error={Boolean(touched.newPassword && errors.newPassword)}
                                                    id="password-new"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={values.newPassword}
                                                    name="newPassword"
                                                    onBlur={handleBlur}
                                                    onChange={(e) => {
                                                        handleChange(e);
                                                        changePassword(e.target.value);
                                                    }}
                                                    endAdornment={
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                aria-label="toggle password visibility"
                                                                onClick={handleClickShowPassword}
                                                                onMouseDown={handleMouseDownPassword}
                                                                edge="end"
                                                                size="large"
                                                            >
                                                                {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    }
                                                    placeholder="******"
                                                    inputProps={{}}
                                                />
                                                {touched.newPassword && errors.newPassword && (
                                                    <FormHelperText error id="helper-text-password-new">
                                                        {errors.newPassword}
                                                    </FormHelperText>
                                                )}
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Stack spacing={1}>
                                                <InputLabel htmlFor="password-confirmation">Confirmation Password</InputLabel>
                                                <OutlinedInput
                                                    fullWidth
                                                    error={Boolean(touched.newPasswordConfirmation && errors.newPasswordConfirmation)}
                                                    id="password-confirmation"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={values.newPasswordConfirmation}
                                                    name="newPasswordConfirmation"
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    validate={(value) => validateConfirmPassword(values.newPassword, value)}
                                                    endAdornment={
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                aria-label="toggle password visibility"
                                                                onClick={handleClickShowPassword}
                                                                onMouseDown={handleMouseDownPassword}
                                                                edge="end"
                                                                size="large"
                                                            >
                                                                {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    }
                                                    placeholder="******"
                                                    inputProps={{}}
                                                />
                                                {touched.newPasswordConfirmation && errors.newPasswordConfirmation && (
                                                    <FormHelperText error id="helper-text-password-confirmation">
                                                        {errors.newPasswordConfirmation}
                                                    </FormHelperText>
                                                )}
                                            </Stack>
                                        </Grid>
                                    </Stack>
                                    <FormControl fullWidth sx={{ mt: 2 }}>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item>
                                                <Box sx={{ bgcolor: level?.color, width: 85, height: 8, borderRadius: '7px' }} />
                                            </Grid>
                                            <Grid item>
                                                <Typography variant="subtitle1" fontSize="0.75rem">
                                                    {level?.label}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </FormControl>
                                    {errors.submit && (
                                        <Grid item xs={12}>
                                            <FormHelperText error>{errors.submit}</FormHelperText>
                                        </Grid>
                                    )}
                                    <Grid item xs={3} sx={{ mt: 2 }}>
                                        <AnimateButton>
                                            <Button
                                                disableElevation
                                                disabled={isSubmitting}
                                                fullWidth
                                                size="large"
                                                type="submit"
                                                variant="contained"
                                                color="primary"
                                            >
                                                Save
                                            </Button>
                                        </AnimateButton>
                                    </Grid>
                                </form>
                            )}
                        </Formik>
                    </MainCard>
                </Grid>
            </Grid>
        </ComponentSkeleton>
    );
}
